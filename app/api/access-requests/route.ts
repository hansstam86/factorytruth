import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getEntrepreneurSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as entrepreneur to request access." }, { status: 401 });
    }
    const session = await verifyEntrepreneurSession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, questionIds } = body;
    if (!submissionId || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "submissionId and questionIds required" }, { status: 400 });
    }

    const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const existing = await prisma.accessRequest.findFirst({
      where: {
        submissionId,
        entrepreneurEmail: session.email,
        status: "pending",
      },
    });

    if (existing) {
      const merged = Array.from(new Set([...(existing.questionIds as string[]), ...questionIds]));
      await prisma.accessRequest.update({
        where: { id: existing.id },
        data: { questionIds: merged as object },
      });
      return NextResponse.json({ ok: true, id: existing.id });
    }

    const id = `ar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.accessRequest.create({
      data: {
        id,
        submissionId,
        entrepreneurEmail: session.email,
        entrepreneurName: session.name ?? undefined,
        questionIds: Array.from(new Set(questionIds)) as object,
        status: "pending",
        createdAt: new Date(),
      },
    });

    const factoryEmail = sub.userId?.trim();
    if (factoryEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.factorytruth.com";
      const link = `${appUrl.replace(/\/$/, "")}/factories/access-requests`;
      await sendEmail({
        to: factoryEmail,
        subject: "Factory Truth: New access request to your private answers",
        html: `<p>An entrepreneur has requested access to your private audit answers on Factory Truth.</p><p><a href="${link}">View and respond to access requests</a></p><p>You need to be logged in to the factory portal.</p>`,
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("access-requests POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");

  const cookieStore = await cookies();
  const factoryToken = cookieStore.get(getSessionCookieName())?.value;
  if (!factoryToken) {
    return NextResponse.json({ error: "Log in as factory to list requests." }, { status: 401 });
  }
  const session = await verifySession(factoryToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const mine = await prisma.submission.findFirst({
    where: { userId: session.email },
    orderBy: { createdAt: "desc" },
  });
  if (!submissionId || mine?.id !== submissionId) {
    return NextResponse.json({ error: "Forbidden or missing submissionId" }, { status: 403 });
  }

  const forThis = await prisma.accessRequest.findMany({
    where: { submissionId },
    orderBy: { createdAt: "desc" },
  });
  const list = forThis.map((r) => ({
    id: r.id,
    submissionId: r.submissionId,
    entrepreneurEmail: r.entrepreneurEmail,
    entrepreneurName: r.entrepreneurName,
    questionIds: r.questionIds,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString(),
  }));
  return NextResponse.json(list);
}
