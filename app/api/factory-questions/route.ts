import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** GET ?submissionId=... — List questions. Factory owner sees all for their submission; entrepreneur sees only their own. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!sub) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    const cookieStore = await cookies();
    const factoryToken = cookieStore.get(getSessionCookieName())?.value;
    const entrepreneurToken = cookieStore.get(getEntrepreneurSessionCookieName())?.value;

    const forSubmission = await prisma.factoryQuestion.findMany({
      where: { submissionId },
      orderBy: { createdAt: "desc" },
    });
    const list = forSubmission.map((q) => ({
      id: q.id,
      submissionId: q.submissionId,
      entrepreneurEmail: q.entrepreneurEmail,
      questionText: q.questionText,
      answer: q.answer ?? undefined,
      answeredAt: q.answeredAt?.toISOString(),
      createdAt: q.createdAt.toISOString(),
    }));

    if (factoryToken) {
      const session = await verifySession(factoryToken);
      if (session?.email === sub.userId) {
        return NextResponse.json(list);
      }
    }
    if (entrepreneurToken) {
      const session = await verifyEntrepreneurSession(entrepreneurToken);
      if (session?.email) {
        const mine = list.filter((q) => q.entrepreneurEmail === session.email);
        return NextResponse.json(mine);
      }
    }

    return NextResponse.json([]);
  } catch (e) {
    console.error("factory-questions GET error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST — Entrepreneur asks a question. Body: { submissionId, questionText }. */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getEntrepreneurSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as entrepreneur to ask a question." }, { status: 401 });
    }
    const session = await verifyEntrepreneurSession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const body = await request.json();
    const submissionId = (body.submissionId || "").trim();
    const questionText = (body.questionText || "").trim();
    if (!submissionId || !questionText) {
      return NextResponse.json({ error: "submissionId and questionText required" }, { status: 400 });
    }

    const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!sub) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    const id = `fq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.factoryQuestion.create({
      data: {
        id,
        submissionId,
        entrepreneurEmail: session.email,
        questionText,
        createdAt: new Date(),
      },
    });

    const factoryEmail = sub.userId?.trim();
    if (factoryEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.factorytruth.com";
      const link = `${appUrl.replace(/\/$/, "")}/factories`;
      const fromLabel = session.name ? `${session.name} (${session.email})` : session.email;
      await sendEmail({
        to: factoryEmail,
        subject: "Factory Truth: New question from an entrepreneur",
        html: `<p>You have a new question on Factory Truth from ${fromLabel}:</p><blockquote>${escapeHtml(questionText)}</blockquote><p><a href="${link}">Log in to the factory portal</a> to view and reply.</p>`,
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("factory-questions POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
