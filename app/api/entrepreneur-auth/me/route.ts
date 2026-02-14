import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/entrepreneur-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: { email: session.email, name: session.name },
    });
  } catch (e) {
    console.error("entrepreneur me error", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
