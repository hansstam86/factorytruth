import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  hashPassword,
  createSession,
  getSessionCookieName,
  getCookieOptions,
} from "@/lib/entrepreneur-auth";

const USERS_FILE = path.join(process.cwd(), "data", "entrepreneur-users.json");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    let users: { email: string; passwordHash: string; name?: string; createdAt: string }[] = [];
    try {
      const raw = await readFile(USERS_FILE, "utf-8");
      users = JSON.parse(raw);
    } catch {
      await mkdir(path.dirname(USERS_FILE), { recursive: true });
    }

    if (users.some((u) => u.email === email)) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    users.push({
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

    const token = await createSession(email);
    const res = NextResponse.json({ ok: true, email });
    res.cookies.set(getSessionCookieName(), token, getCookieOptions());
    return res;
  } catch (e) {
    console.error("entrepreneur register error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
