import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const session = await verifyAdminSession(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { email: session.email } });
}
