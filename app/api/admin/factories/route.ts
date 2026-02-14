import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

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
    const raw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      createdAt: string;
    }[];
    const factories = list.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      name: entry.answers?.q1 || "Unnamed factory",
      address: entry.answers?.q2 || "",
      createdAt: entry.createdAt,
    }));
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

    let users: { email: string; passwordHash: string; createdAt?: string }[] = [];
    try {
      users = JSON.parse(await readFile(USERS_FILE, "utf-8"));
    } catch {
      await mkdir(DATA_DIR, { recursive: true });
    }

    if (users.some((u) => u.email === email)) {
      return NextResponse.json({ error: "This email is already registered as a factory" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    users.push({
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    console.error("admin factories POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
