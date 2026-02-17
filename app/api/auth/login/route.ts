import { NextResponse } from "next/server";
import {
  verifyPassword,
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

    const user = await prisma.user.findUnique({ where: { email } });
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
