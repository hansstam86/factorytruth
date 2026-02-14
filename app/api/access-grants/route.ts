import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";

const DATA_DIR = path.join(process.cwd(), "data");
const GRANTS_FILE = path.join(DATA_DIR, "access-grants.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

type Grant = {
  submissionId: string;
  entrepreneurEmail: string;
  questionIds: string[];
  grantedAt: string;
};

async function loadGrants(): Promise<Grant[]> {
  try {
    const raw = await readFile(GRANTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    return [];
  }
}

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

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
    const mine = submissions.find((s) => s.userId === session.email);
    if (mine?.id !== submissionId) {
      return NextResponse.json({ error: "Forbidden or submission not found" }, { status: 403 });
    }

    const grants = await loadGrants();
    const forSubmission = grants.filter((g) => g.submissionId === submissionId);
    const byEmail = new Map<string, string[]>();
    for (const g of forSubmission) {
      const existing = byEmail.get(g.entrepreneurEmail) ?? [];
      const merged = Array.from(new Set([...existing, ...g.questionIds]));
      byEmail.set(g.entrepreneurEmail, merged);
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

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
    const mine = submissions.find((s) => s.userId === session.email);
    if (mine?.id !== submissionId) {
      return NextResponse.json({ error: "Forbidden or submission not found" }, { status: 403 });
    }

    let grants = await loadGrants();
    const before = grants.length;
    grants = grants.filter(
      (g) => !(g.submissionId === submissionId && g.entrepreneurEmail === entrepreneurEmail)
    );
    if (grants.length === before) {
      return NextResponse.json({ ok: true, revoked: false, message: "No grants found for this entrepreneur." });
    }
    await writeFile(GRANTS_FILE, JSON.stringify(grants, null, 2), "utf-8");
    return NextResponse.json({ ok: true, revoked: true });
  } catch (e) {
    console.error("access-grants DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
