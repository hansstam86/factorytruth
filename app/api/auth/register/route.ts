import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  isEmailAllowed,
  hashPassword,
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

    if (!isEmailAllowed(email)) {
      return NextResponse.json(
        { error: "请使用公司邮箱注册，不能使用个人邮箱（如 Gmail、QQ、163、雅虎等）。" },
        { status: 403 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "密码至少需要 8 个字符。" },
        { status: 400 }
      );
    }

    let users: { email: string; passwordHash: string; createdAt: string }[] = [];
    try {
      const raw = await readFile(USERS_FILE, "utf-8");
      users = JSON.parse(raw);
    } catch {
      await mkdir(path.dirname(USERS_FILE), { recursive: true });
    }

    if (users.some((u) => u.email === email)) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录。" },
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
    console.error("register error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
