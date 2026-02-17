import { NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** GET — return full submission for admin edit. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const { id: submissionId } = await params;
    if (!submissionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const entry = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!entry) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    return NextResponse.json({
      id: entry.id,
      userId: entry.userId,
      answers: (entry.answers as Record<string, string>) ?? {},
      answersEn: entry.answersEn as Record<string, string> | undefined,
      visibility: entry.visibility as Record<string, string> | undefined,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt?.toISOString(),
    });
  } catch (e) {
    console.error("admin factories GET [id] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PATCH — update factory submission answers (partial merge). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const { id: submissionId } = await params;
    if (!submissionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const updates = body.answers;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json({ error: "Body must be { answers: Record<string, string> }." }, { status: 400 });
    }

    const entry = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!entry) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    const merged: Record<string, string> = { ...((entry.answers as Record<string, string>) ?? {}) };
    for (const [key, val] of Object.entries(updates)) {
      if (typeof key === "string" && typeof val === "string") {
        merged[key] = val;
      }
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { answers: merged as object, updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin factories PATCH error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE — remove a factory (submission, user account, related data). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const { id: submissionId } = await params;
    if (!submissionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const entry = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!entry) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    const userId = entry.userId;

    await prisma.factoryQuestion.deleteMany({ where: { submissionId } });
    await prisma.accessGrant.deleteMany({ where: { submissionId } });
    await prisma.accessRequest.deleteMany({ where: { submissionId } });
    await prisma.submission.delete({ where: { id: submissionId } });

    if (userId) {
      await prisma.user.deleteMany({ where: { email: userId } });
    }

    const uploadsPath = path.join(UPLOADS_DIR, submissionId);
    try {
      await rm(uploadsPath, { recursive: true });
    } catch {
      // folder may not exist
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin factories DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
