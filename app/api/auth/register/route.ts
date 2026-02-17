import { NextResponse } from "next/server";
import {
  isEmailAllowed,
  hashPassword,
  createSession,
  getSessionCookieName,
  getCookieOptions,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录。" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { email, passwordHash },
    });

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
