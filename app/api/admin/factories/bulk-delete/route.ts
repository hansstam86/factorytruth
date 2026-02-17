import { NextResponse } from "next/server";
import { readdir, rm } from "fs/promises";
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

/** POST — delete all factory submissions and related data. Body: { confirm: "DELETE ALL" }. */
export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    if (body.confirm !== "DELETE ALL") {
      return NextResponse.json(
        { error: 'Body must be { confirm: "DELETE ALL" } (exact string).' },
        { status: 400 }
      );
    }

    await prisma.factoryQuestion.deleteMany({});
    await prisma.accessGrant.deleteMany({});
    await prisma.accessRequest.deleteMany({});
    await prisma.submission.deleteMany({});

    try {
      const entries = await readdir(UPLOADS_DIR, { withFileTypes: true });
      for (const e of entries) {
        await rm(path.join(UPLOADS_DIR, e.name), { recursive: true });
      }
    } catch {
      // uploads dir may not exist
    }

    return NextResponse.json({ ok: true, deleted: "all" });
  } catch (e) {
    console.error("admin bulk-delete error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
