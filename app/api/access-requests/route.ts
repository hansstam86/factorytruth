import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";

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

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; visibility?: Record<string, string> }[];
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    let list: AccessRequest[] = [];
    try {
      list = JSON.parse(await readFile(REQUESTS_FILE, "utf-8"));
    } catch {
      await mkdir(DATA_DIR, { recursive: true });
    }

    const existing = list.find(
      (r) =>
        r.submissionId === submissionId &&
        r.entrepreneurEmail === session.email &&
        r.status === "pending"
    );
    if (existing) {
      existing.questionIds = Array.from(new Set([...existing.questionIds, ...questionIds]));
      await writeFile(REQUESTS_FILE, JSON.stringify(list, null, 2), "utf-8");
      return NextResponse.json({ ok: true, id: existing.id });
    }

    const id = `ar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    list.push({
      id,
      submissionId,
      entrepreneurEmail: session.email,
      entrepreneurName: session.name,
      questionIds: Array.from(new Set(questionIds)),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    await writeFile(REQUESTS_FILE, JSON.stringify(list, null, 2), "utf-8");
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

  const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
  const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
  const mine = submissions.find((s) => s.userId === session.email);
  if (!submissionId || mine?.id !== submissionId) {
    return NextResponse.json({ error: "Forbidden or missing submissionId" }, { status: 403 });
  }

  let list: AccessRequest[] = [];
  try {
    list = JSON.parse(await readFile(REQUESTS_FILE, "utf-8"));
  } catch {
    return NextResponse.json([]);
  }

  const forThis = list.filter((r) => r.submissionId === submissionId);
  return NextResponse.json(forThis);
}
