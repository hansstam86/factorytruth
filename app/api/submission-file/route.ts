import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");
  const filePath = searchParams.get("path"); // relative path like uploads/f_xxx/B2_file.pdf

  if (!submissionId || !filePath) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (filePath.includes("..") || !filePath.startsWith("uploads/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const fullPath = path.join(DATA_DIR, filePath);
  let canAccess = false;

  try {
    const cookieStore = await cookies();
    const factoryToken = cookieStore.get(getSessionCookieName())?.value;
    const entrepreneurToken = cookieStore.get(getEntrepreneurSessionCookieName())?.value;

    const submissionsRaw = await readFile(path.join(DATA_DIR, "submissions.json"), "utf-8");
    const submissions = JSON.parse(submissionsRaw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      visibility?: Record<string, "public" | "private">;
    }[];
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const questionId = path.basename(filePath).split("_")[0];
    const visibility = sub.visibility?.[questionId] ?? "public";

    if (factoryToken) {
      const session = await verifySession(factoryToken);
      if (session?.email === sub.userId) canAccess = true;
    }
    if (!canAccess && visibility === "public") canAccess = true;
    if (!canAccess && entrepreneurToken) {
      const session = await verifyEntrepreneurSession(entrepreneurToken);
      if (session?.email) {
        const grantsRaw = await readFile(path.join(DATA_DIR, "access-grants.json"), "utf-8").catch(() => "[]");
        const grants = JSON.parse(grantsRaw) as { submissionId: string; entrepreneurEmail: string; questionIds: string[] }[];
        const hasGrant = grants.some(
          (g) => g.submissionId === submissionId && g.entrepreneurEmail === session.email && (g.questionIds.includes(questionId) || g.questionIds.includes("all"))
        );
        if (hasGrant) canAccess = true;
      }
    }

    if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const buf = await readFile(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    const contentType = types[ext] || "application/octet-stream";
    return new NextResponse(buf, {
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("submission-file error", e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
