import { NextResponse } from "next/server";
import {
  createAdminSession,
  getAdminSessionCookieName,
  getAdminCookieOptions,
  isAdminConfigured,
  checkAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin login is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = (body.email || "").trim();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (!checkAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createAdminSession(email);
    const res = NextResponse.json({ ok: true, email: email.toLowerCase() });
    res.cookies.set(getAdminSessionCookieName(), token, getAdminCookieOptions());
    return res;
  } catch (e) {
    console.error("admin login error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
