import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as factory." }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const body = await request.json();
    const status = body.status as string;
    if (status !== "approved" && status !== "denied") {
      return NextResponse.json({ error: "status must be approved or denied" }, { status: 400 });
    }

    const req = await prisma.accessRequest.findUnique({ where: { id } });
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (req.status !== "pending") {
      return NextResponse.json({ error: "Already responded" }, { status: 400 });
    }

    const sub = await prisma.submission.findUnique({ where: { id: req.submissionId } });
    if (!sub || sub.userId !== session.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    await prisma.accessRequest.update({
      where: { id },
      data: { status, respondedAt: now },
    });

    if (status === "approved") {
      await prisma.accessGrant.create({
        data: {
          submissionId: req.submissionId,
          entrepreneurEmail: req.entrepreneurEmail,
          questionIds: req.questionIds as object,
          grantedAt: now,
        },
      });
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("access-requests PATCH error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
