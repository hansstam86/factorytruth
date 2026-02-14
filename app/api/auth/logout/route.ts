import { NextResponse } from "next/server";
import { getSessionCookieName, getCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return res;
}
