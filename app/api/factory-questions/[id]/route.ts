import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const QUESTIONS_FILE = path.join(DATA_DIR, "factory-questions.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

type FactoryQuestion = {
  id: string;
  submissionId: string;
  entrepreneurEmail: string;
  entrepreneurName?: string;
  questionText: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
};

async function loadQuestions(): Promise<FactoryQuestion[]> {
  try {
    const raw = await readFile(QUESTIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    return [];
  }
}

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

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
    const questions = await loadQuestions();
    const q = questions.find((x) => x.id === id);
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const sub = submissions.find((s) => s.id === q.submissionId);
    if (!sub || sub.userId !== session.email) {
      return NextResponse.json({ error: "You can only answer questions for your own factory." }, { status: 403 });
    }

    const body = await request.json();
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    q.answer = answer;
    q.answeredAt = new Date().toISOString();
    await writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("factory-questions PATCH error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
