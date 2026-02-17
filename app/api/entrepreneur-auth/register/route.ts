import { NextResponse } from "next/server";
import {
  hashPassword,
  createSession,
  getSessionCookieName,
  getCookieOptions,
} from "@/lib/entrepreneur-auth";
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.entrepreneurUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.entrepreneurUser.create({
      data: { email, passwordHash },
    });

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
