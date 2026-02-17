import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
  const resolvedPath = path.resolve(fullPath);
  const resolvedDataDir = path.resolve(DATA_DIR);
  if (resolvedPath === resolvedDataDir || !resolvedPath.startsWith(resolvedDataDir + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  let canAccess = false;

  try {
    const cookieStore = await cookies();
    const factoryToken = cookieStore.get(getSessionCookieName())?.value;
    const entrepreneurToken = cookieStore.get(getEntrepreneurSessionCookieName())?.value;

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, visibility: true },
    });
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const visibility = (sub.visibility as Record<string, "public" | "private">) ?? {};
    const questionId = path.basename(filePath).split("_")[0];
    const questionVisibility = visibility[questionId] ?? "public";

    if (factoryToken) {
      const session = await verifySession(factoryToken);
      if (session?.email === sub.userId) canAccess = true;
    }
    if (!canAccess && questionVisibility === "public") canAccess = true;
    if (!canAccess && entrepreneurToken) {
      const session = await verifyEntrepreneurSession(entrepreneurToken);
      if (session?.email) {
        const grants = await prisma.accessGrant.findMany({
          where: { submissionId, entrepreneurEmail: session.email },
        });
        const hasGrant = grants.some((g) => {
          const ids = (g.questionIds as string[]) ?? [];
          return ids.includes(questionId) || ids.includes("all");
        });
        if (hasGrant) canAccess = true;
      }
    }

    if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const buf = await readFile(resolvedPath);
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
