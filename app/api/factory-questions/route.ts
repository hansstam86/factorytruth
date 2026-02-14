import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";

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

/** GET ?submissionId=... — List questions. Factory owner sees all for their submission; entrepreneur sees only their own. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    const cookieStore = await cookies();
    const factoryToken = cookieStore.get(getSessionCookieName())?.value;
    const entrepreneurToken = cookieStore.get(getEntrepreneurSessionCookieName())?.value;

    const questions = await loadQuestions();
    const forSubmission = questions.filter((q) => q.submissionId === submissionId);

    if (factoryToken) {
      const session = await verifySession(factoryToken);
      if (session?.email === sub.userId) {
        return NextResponse.json(forSubmission);
      }
    }
    if (entrepreneurToken) {
      const session = await verifyEntrepreneurSession(entrepreneurToken);
      if (session?.email) {
        const mine = forSubmission.filter((q) => q.entrepreneurEmail === session.email);
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

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string }[];
    if (!submissions.some((s) => s.id === submissionId)) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    const questions = await loadQuestions();
    const id = `fq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    questions.push({
      id,
      submissionId,
      entrepreneurEmail: session.email,
      entrepreneurName: session.name,
      questionText,
      createdAt: new Date().toISOString(),
    });
    await writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2), "utf-8");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("factory-questions POST error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
