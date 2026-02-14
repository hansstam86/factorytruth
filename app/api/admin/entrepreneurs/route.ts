import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/entrepreneur-auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "entrepreneur-users.json");

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

type EntrepreneurUser = {
  email: string;
  passwordHash?: string;
  name?: string;
  provider?: string;
  createdAt?: string;
};

/** GET — list all entrepreneurs (no password hashes). */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const raw = await readFile(USERS_FILE, "utf-8").catch(() => "[]");
    const list = JSON.parse(raw) as EntrepreneurUser[];
    const safe = list.map((u) => ({
      email: u.email,
      name: u.name,
      provider: u.provider,
      createdAt: u.createdAt,
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

    let users: EntrepreneurUser[] = [];
    try {
      users = JSON.parse(await readFile(USERS_FILE, "utf-8"));
    } catch {
      await mkdir(DATA_DIR, { recursive: true });
    }

    if (users.some((u) => u.email === email)) {
      return NextResponse.json({ error: "This email is already registered as an entrepreneur" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    users.push({
      email,
      passwordHash,
      name,
      createdAt: new Date().toISOString(),
    });
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
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

    let users: EntrepreneurUser[] = [];
    try {
      users = JSON.parse(await readFile(USERS_FILE, "utf-8"));
    } catch {
      return NextResponse.json({ error: "No entrepreneurs file" }, { status: 200 });
    }

    const before = users.length;
    users = users.filter((u) => u.email !== email);
    if (users.length === before) {
      return NextResponse.json({ error: "Entrepreneur not found" }, { status: 404 });
    }
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin entrepreneurs DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
