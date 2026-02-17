import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth";
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

/** GET — list all factories (submissions) for admin. */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const list = await prisma.submission.findMany({
      select: { id: true, userId: true, answers: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const factories = list.map((entry) => {
      const answers = (entry.answers as Record<string, string>) ?? {};
      return {
        id: entry.id,
        userId: entry.userId,
        name: answers.q1 || "Unnamed factory",
        address: answers.q2 || "",
        expertise: answers.q3 || "",
        createdAt: entry.createdAt.toISOString(),
      };
    });
    return NextResponse.json(factories);
  } catch (e) {
    console.error("admin factories GET error", e);
    return NextResponse.json([], { status: 200 });
  }
}

/** POST — create a factory user account (admin can use any email). */
export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "This email is already registered as a factory" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { email, passwordHash },
    });
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    console.error("admin factories POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
