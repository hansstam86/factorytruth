import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { getQuestionsSync, getQuestionsFilePath } from "@/lib/audit-questions-server";
import type { AuditQuestion } from "@/lib/audit-questions";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** GET — list current questions (admin only). */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const questions = getQuestionsSync();
    return NextResponse.json(questions);
  } catch (e) {
    console.error("admin questions GET error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PUT — replace questions with body (admin only). Body: AuditQuestion[]. */
export async function PUT(request: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array of questions" }, { status: 400 });
    }
    const questions = body as AuditQuestion[];
    const filePath = getQuestionsFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(questions, null, 2), "utf-8");
    return NextResponse.json({ ok: true, count: questions.length });
  } catch (e) {
    console.error("admin questions PUT error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
