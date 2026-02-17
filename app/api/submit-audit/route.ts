import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { translateAnswers } from "@/lib/translate";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXT = /\.(pdf|ppt|pptx|xls|xlsx|jpg|jpeg|png|gif|webp)$/i;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

/** Only allow question ids that are alphanumeric, underscore, or hyphen (e.g. q1, B2). */
const SAFE_QUESTION_ID = /^[a-zA-Z0-9_-]+$/;
function isSafeQuestionId(id: string): boolean {
  return id.length > 0 && id.length <= 64 && SAFE_QUESTION_ID.test(id);
}

const REQUIRED_BASIC_IDS = ["q1", "q2"] as const;

function validateBasicInfo(answers: Record<string, string>): NextResponse | null {
  for (const id of REQUIRED_BASIC_IDS) {
    if (!answers[id] || !String(answers[id]).trim()) {
      const msg = id === "q1" ? "请填写工厂名称。" : "请填写工厂地址。";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
  return null;
}

/** Normalize visibility so only "private" | "public" are stored; default to public when missing. */
function normalizeVisibility(
  raw: Record<string, unknown> | null | undefined
): Record<string, "public" | "private"> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, "public" | "private"> = {};
  for (const [key, val] of Object.entries(raw)) {
    const v = String(val).toLowerCase().trim();
    out[key] = v === "private" ? "private" : "public";
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "登录已过期，请重新登录。" }, { status: 401 });
    }
    const userId = session.email;

    const contentType = request.headers.get("content-type") || "";
    let answers: Record<string, string> = {};
    let visibility: Record<string, "public" | "private"> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const answersStr = formData.get("answers");
      const visibilityStr = formData.get("visibility");
      if (typeof answersStr === "string") {
        try {
          answers = JSON.parse(answersStr);
        } catch {
          return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
        }
      }
      if (typeof visibilityStr === "string") {
        try {
          visibility = normalizeVisibility(JSON.parse(visibilityStr));
        } catch {
          visibility = {};
        }
      }

      const existing = await prisma.submission.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      const now = new Date();
      let submissionId: string;

      if (existing) {
        submissionId = existing.id;
        const existingAnswers = (existing.answers as Record<string, string>) ?? {};
        answers = { ...existingAnswers, ...answers };
      } else {
        submissionId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      }

      const uploadDir = path.join(UPLOADS_DIR, submissionId);
      await mkdir(uploadDir, { recursive: true });

      for (const [key, value] of Array.from(formData.entries())) {
        if (!key.startsWith("file_") || !(value instanceof File)) continue;
        const questionId = key.slice(5);
        if (!isSafeQuestionId(questionId)) continue;
        const file = value;
        if (file.size > MAX_FILE_SIZE) continue;
        const base = file.name || "file";
        if (!ALLOWED_EXT.test(base)) continue;
        const filename = `${questionId}_${Date.now()}_${sanitizeFilename(base)}`;
        const filePath = path.join(uploadDir, filename);
        const resolvedFilePath = path.resolve(filePath);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (resolvedFilePath !== resolvedUploadDir && !resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
          continue;
        }
        const buf = await file.arrayBuffer();
        await writeFile(resolvedFilePath, Buffer.from(buf));

        const relativePath = `uploads/${submissionId}/${filename}`;
        const entry = { path: relativePath, name: file.name || "" };
        const existing = answers[questionId];
        let arr: { path: string; name: string }[];
        try {
          arr = existing ? JSON.parse(existing) : [];
        } catch {
          arr = existing ? [{ path: existing, name: "" }] : [];
        }
        if (!Array.isArray(arr)) arr = [{ path: existing as string, name: "" }];
        arr.push(entry);
        answers[questionId] = arr.length === 1 ? relativePath : JSON.stringify(arr);
      }

      const validationError = validateBasicInfo(answers);
      if (validationError) return validationError;

      const savedVisibility = existing
        ? { ...((existing.visibility as Record<string, "public" | "private">) ?? {}), ...visibility }
        : visibility;

      let answersEn: Record<string, string> | undefined;
      try {
        answersEn = await translateAnswers(answers);
      } catch (e) {
        console.error("translate answers error", e);
      }

      if (existing) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            answers: answers as object,
            answersEn: (answersEn ?? (existing.answersEn as Record<string, string>)) as object,
            visibility: savedVisibility as object,
            updatedAt: now,
          },
        });
      } else {
        await prisma.submission.create({
          data: {
            id: submissionId,
            userId,
            answers: answers as object,
            answersEn: answersEn as object,
            visibility: savedVisibility as object,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
      return NextResponse.json({
        ok: true,
        id: submissionId,
        updated: !!existing,
      });
    }

    const body = await request.json();
    answers = body.answers || {};
    visibility = normalizeVisibility(body.visibility);
    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid payload: answers required" },
        { status: 400 }
      );
    }
    const validationError = validateBasicInfo(answers);
    if (validationError) return validationError;

    const existing = await prisma.submission.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    const mergedAnswers = existing
      ? { ...((existing.answers as Record<string, string>) ?? {}), ...answers }
      : answers;
    const savedVisibilityJson = existing
      ? { ...((existing.visibility as Record<string, "public" | "private">) ?? {}), ...visibility }
      : visibility;

    let answersEn: Record<string, string> | undefined;
    try {
      answersEn = await translateAnswers(mergedAnswers);
    } catch (e) {
      console.error("translate answers error", e);
    }

    if (existing) {
      await prisma.submission.update({
        where: { id: existing.id },
        data: {
          answers: mergedAnswers as object,
          answersEn: (answersEn ?? (existing.answersEn as Record<string, string>)) as object,
          visibility: savedVisibilityJson as object,
          updatedAt: now,
        },
      });
      return NextResponse.json({
        ok: true,
        id: existing.id,
        updated: true,
      });
    }

    const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.submission.create({
      data: {
        id,
        userId,
        answers: mergedAnswers as object,
        answersEn: answersEn as object,
        visibility: savedVisibilityJson as object,
        createdAt: now,
        updatedAt: now,
      },
    });
    return NextResponse.json({ ok: true, id, updated: false });
  } catch (e) {
    console.error("submit-audit error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
