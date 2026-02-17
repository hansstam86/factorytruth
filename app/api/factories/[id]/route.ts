import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";
import { getQuestionsSync } from "@/lib/audit-questions-server";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const GRANTS_FILE = path.join(DATA_DIR, "access-grants.json");
const REQUESTS_FILE = path.join(DATA_DIR, "access-requests.json");

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      answersEn?: Record<string, string>;
      visibility?: Record<string, "public" | "private">;
      createdAt: string;
    }[];

    const entry = list.find((e) => e.id === id);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let grantedQuestionIds: string[] = [];
    let isFactoryOwner = false;
    const cookieStore = await cookies();
    const factoryToken = cookieStore.get(getSessionCookieName())?.value;
    const entrepreneurToken = cookieStore.get(getEntrepreneurSessionCookieName())?.value;

    if (factoryToken) {
      const session = await verifySession(factoryToken);
      if (session?.email === entry.userId) {
        grantedQuestionIds = ["all"];
        isFactoryOwner = true;
      }
    }
    if (grantedQuestionIds.length === 0 && entrepreneurToken) {
      const session = await verifyEntrepreneurSession(entrepreneurToken);
      if (session?.email) {
        try {
          const grantsRaw = await readFile(GRANTS_FILE, "utf-8");
          const grants = JSON.parse(grantsRaw) as { submissionId: string; entrepreneurEmail: string; questionIds: string[] }[];
          const forEntrepreneur = grants.filter(
            (g) => g.submissionId === id && g.entrepreneurEmail === session.email
          );
          if (forEntrepreneur.length > 0) {
            const merged = forEntrepreneur.flatMap((g) => g.questionIds);
            grantedQuestionIds = merged.includes("all") ? ["all"] : Array.from(new Set(merged));
          }
        } catch {
          // no grants
        }
      }
    }

    const visibility = entry.visibility ?? {};
    const canSee = (qId: string) => {
      if (visibility[qId] !== "private") return true;
      if (grantedQuestionIds.includes("all")) return true;
      return grantedQuestionIds.includes(qId);
    };

    const sourceAnswers = isFactoryOwner
      ? entry.answers
      : { ...entry.answers, ...(entry.answersEn ?? {}) };
    const filteredAnswers: Record<string, string> = {};
    for (const [qId, value] of Object.entries(entry.answers)) {
      if (canSee(qId)) {
        filteredAnswers[qId] = sourceAnswers[qId] ?? value;
      }
    }

    const questions = getQuestionsSync();
    const totalQuestions = questions.length;
    const answeredCount = totalQuestions
      ? questions.filter((q) => {
          const v = entry.answers[q.id];
          return v != null && String(v).trim() !== "";
        }).length
      : 0;
    const transparencyScore = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    let rankPercentile: number | null = null;
    let accessRequestCount = 0;
    try {
      const allScores = list.map((e) => {
        const ans = e.answers || {};
        const n = totalQuestions ? questions.filter((q) => ans[q.id] != null && String(ans[q.id]).trim() !== "").length : 0;
        return totalQuestions > 0 ? Math.round((n / totalQuestions) * 100) : 0;
      });
      const totalFactories = allScores.length;
      const withLowerScore = allScores.filter((s) => s < transparencyScore).length;
      rankPercentile = totalFactories > 1 ? Math.round((withLowerScore / totalFactories) * 100) : 100;

      const requestsRaw = await readFile(REQUESTS_FILE, "utf-8");
      const requests = JSON.parse(requestsRaw) as { submissionId: string }[];
      accessRequestCount = requests.filter((r) => r.submissionId === id).length;
    } catch {
      // optional stats
    }

    const questionsEn = Object.fromEntries(questions.map((q) => [q.id, q.questionEn]));
    const questionsList = questions.map((q) => ({ id: q.id, sectionEn: q.sectionEn, questionEn: q.questionEn }));

    return NextResponse.json({
      id: entry.id,
      createdAt: entry.createdAt,
      name: entry.answers.q1 || "Unnamed factory",
      address: entry.answers.q2,
      answers: filteredAnswers,
      visibility,
      questionsEn,
      questions: questionsList,
      privateQuestionIds: Object.entries(visibility)
        .filter(([, v]) => v === "private")
        .map(([qId]) => qId),
      transparencyScore,
      rankPercentile,
      accessRequestCount,
    });
  } catch (e) {
    console.error("factory detail error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
