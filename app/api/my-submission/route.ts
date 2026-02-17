import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ submission: null }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ submission: null }, { status: 401 });
    }
    const userId = session.email;

    const mine = await prisma.submission.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!mine) {
      return NextResponse.json({ submission: null }, { status: 200 });
    }
    return NextResponse.json({
      submission: {
        id: mine.id,
        answers: (mine.answers as Record<string, string>) ?? {},
        visibility: (mine.visibility as Record<string, "public" | "private">) ?? {},
        createdAt: mine.createdAt.toISOString(),
        updatedAt: mine.updatedAt?.toISOString(),
      },
    });
  } catch (e) {
    console.error("my-submission error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
