import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import {
  verifyPassword,
  createSession,
  getSessionCookieName,
  getCookieOptions,
} from "@/lib/auth";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

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

    let users: { email: string; passwordHash: string }[] = [];
    try {
      const raw = await readFile(USERS_FILE, "utf-8");
      users = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "邮箱或密码错误。" },
        { status: 401 }
      );
    }

    const user = users.find((u) => u.email === email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "邮箱或密码错误。" },
        { status: 401 }
      );
    }

    const token = await createSession(email);
    const res = NextResponse.json({ ok: true, email });
    res.cookies.set(getSessionCookieName(), token, getCookieOptions());
    return res;
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
