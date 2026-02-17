import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET ?submissionId=... — list current access (aggregated by entrepreneur). Factory must own submission. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as factory to list grants." }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const mine = await prisma.submission.findFirst({
      where: { userId: session.email },
      orderBy: { createdAt: "desc" },
    });
    if (mine?.id !== submissionId) {
      return NextResponse.json({ error: "Forbidden or submission not found" }, { status: 403 });
    }

    const grants = await prisma.accessGrant.findMany({
      where: { submissionId },
    });
    const byEmail = new Map<string, string[]>();
    for (const g of grants) {
      const ids = (g.questionIds as string[]) ?? [];
      const existing = byEmail.get(g.entrepreneurEmail) ?? [];
      byEmail.set(g.entrepreneurEmail, Array.from(new Set([...existing, ...ids])));
    }
    const list = Array.from(byEmail.entries()).map(([entrepreneurEmail, questionIds]) => ({
      entrepreneurEmail,
      questionIds,
    }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("access-grants GET error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE ?submissionId=...&entrepreneurEmail=... — revoke all access for that entrepreneur. Factory must own submission. */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    const entrepreneurEmail = searchParams.get("entrepreneurEmail");
    if (!submissionId || !entrepreneurEmail) {
      return NextResponse.json({ error: "submissionId and entrepreneurEmail required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Log in as factory to revoke access." }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    const mine = await prisma.submission.findFirst({
      where: { userId: session.email },
      orderBy: { createdAt: "desc" },
    });
    if (mine?.id !== submissionId) {
      return NextResponse.json({ error: "Forbidden or submission not found" }, { status: 403 });
    }

    const result = await prisma.accessGrant.deleteMany({
      where: { submissionId, entrepreneurEmail },
    });
    return NextResponse.json({
      ok: true,
      revoked: result.count > 0,
      ...(result.count === 0 ? { message: "No grants found for this entrepreneur." } : {}),
    });
  } catch (e) {
    console.error("access-grants DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
