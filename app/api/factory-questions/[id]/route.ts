import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { translateToEnglish } from "@/lib/translate";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** PATCH — Factory answers a question. Body: { answer }. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as factory to answer." }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const q = await prisma.factoryQuestion.findUnique({ where: { id } });
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const sub = await prisma.submission.findUnique({ where: { id: q.submissionId } });
    if (!sub || sub.userId !== session.email) {
      return NextResponse.json({ error: "You can only answer questions for your own factory." }, { status: 403 });
    }

    const body = await request.json();
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const now = new Date();

    let answerEn: string | null = null;
    if (answer) {
      try {
        const translated = await translateToEnglish(answer);
        if (translated && translated.trim() !== answer.trim()) {
          answerEn = translated;
        }
      } catch (e) {
        console.error("Translate factory answer to English failed", e);
      }
    }

    await prisma.factoryQuestion.update({
      where: { id },
      data: { answer, answerEn, answeredAt: now },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("factory-questions PATCH error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
