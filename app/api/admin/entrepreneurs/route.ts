import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/entrepreneur-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** GET — list all entrepreneurs (no password hashes). */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const list = await prisma.entrepreneurUser.findMany({
      select: { email: true, name: true, googleId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const safe = list.map((u) => ({
      email: u.email,
      name: u.name ?? undefined,
      provider: u.googleId ? "google" : undefined,
      createdAt: u.createdAt.toISOString(),
    }));
    return NextResponse.json(safe);
  } catch (e) {
    console.error("admin entrepreneurs GET error", e);
    return NextResponse.json([], { status: 200 });
  }
}

/** POST — create an entrepreneur account. */
export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    const name = (body.name || "").trim() || undefined;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.entrepreneurUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "This email is already registered as an entrepreneur" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.entrepreneurUser.create({
      data: { email, passwordHash, name },
    });
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    console.error("admin entrepreneurs POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE — remove an entrepreneur by email. Body: { email }. */
export async function DELETE(request: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const result = await prisma.entrepreneurUser.deleteMany({ where: { email } });
    if (result.count === 0) {
      return NextResponse.json({ error: "Entrepreneur not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin entrepreneurs DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
