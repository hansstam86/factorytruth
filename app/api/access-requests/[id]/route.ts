import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const REQUESTS_FILE = path.join(DATA_DIR, "access-requests.json");
const GRANTS_FILE = path.join(DATA_DIR, "access-grants.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

type AccessRequest = {
  id: string;
  submissionId: string;
  entrepreneurEmail: string;
  entrepreneurName?: string;
  questionIds: string[];
  status: "pending" | "approved" | "denied";
  createdAt: string;
  respondedAt?: string;
};

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

    const list: AccessRequest[] = JSON.parse(await readFile(REQUESTS_FILE, "utf-8"));
    const req = list.find((r) => r.id === id);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (req.status !== "pending") {
      return NextResponse.json({ error: "Already responded" }, { status: 400 });
    }

    const submissions = JSON.parse(await readFile(SUBMISSIONS_FILE, "utf-8")) as { id: string; userId?: string }[];
    const sub = submissions.find((s) => s.id === req.submissionId);
    if (!sub || sub.userId !== session.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();
    req.status = status;
    req.respondedAt = now;
    await writeFile(REQUESTS_FILE, JSON.stringify(list, null, 2), "utf-8");

    if (status === "approved") {
      let grants: { submissionId: string; entrepreneurEmail: string; questionIds: string[]; grantedAt: string }[] = [];
      try {
        grants = JSON.parse(await readFile(GRANTS_FILE, "utf-8"));
      } catch {
        grants = [];
      }
      grants.push({
        submissionId: req.submissionId,
        entrepreneurEmail: req.entrepreneurEmail,
        questionIds: req.questionIds,
        grantedAt: now,
      });
      await writeFile(GRANTS_FILE, JSON.stringify(grants, null, 2), "utf-8");
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("access-requests PATCH error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
