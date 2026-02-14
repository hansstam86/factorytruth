import { NextResponse } from "next/server";
import { getAdminSessionCookieName, getAdminCookieOptions } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminSessionCookieName(), "", {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });
  return res;
}
