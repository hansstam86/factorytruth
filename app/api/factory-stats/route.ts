import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { getQuestionsSync } from "@/lib/audit-questions-server";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

const MILESTONES = [25, 50, 75, 90, 100];

/** Returns badge label (Chinese) for a transparency score. */
function getBadge(score: number): string {
  if (score >= 90) return "透明之星";
  if (score >= 75) return "高透明工厂";
  if (score >= 50) return "积极填写";
  if (score >= 25) return "起步";
  return "继续努力";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.email;

    const raw = await readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      createdAt?: string;
    }[];

    const questions = getQuestionsSync();
    const totalQuestions = questions.length;

    const scores: number[] = [];
    let myScore = 0;
    let myAnsweredCount = 0;
    let mySubmissionId: string | null = null;

    for (const entry of list) {
      const answers = entry.answers || {};
      const answeredCount = totalQuestions
        ? questions.filter((q) => {
            const v = answers[q.id];
            return v != null && String(v).trim() !== "";
          }).length
        : 0;
      const score = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
      scores.push(score);
      if (entry.userId === userId) {
        myScore = score;
        myAnsweredCount = answeredCount;
        mySubmissionId = entry.id;
      }
    }

    const totalFactories = scores.length;
    const factoriesWithLowerScore = totalFactories
      ? scores.filter((s) => s < myScore).length
      : 0;
    const rankPercentile =
      totalFactories > 1
        ? Math.round((factoriesWithLowerScore / totalFactories) * 100)
        : 100;
    const platformAverageScore =
      totalFactories > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / totalFactories)
        : 0;

    const nextMilestone = (() => {
      const next = MILESTONES.find((m) => m > myScore);
      if (next == null || totalQuestions === 0) return null;
      const targetAnswered = Math.ceil((next / 100) * totalQuestions);
      const questionsNeeded = Math.max(0, targetAnswered - myAnsweredCount);
      return { targetPct: next, questionsNeeded };
    })();

    return NextResponse.json({
      myScore,
      myAnsweredCount,
      totalQuestions,
      totalFactories,
      rankPercentile,
      factoriesBeatCount: factoriesWithLowerScore,
      platformAverageScore,
      nextMilestone,
      badge: getBadge(myScore),
      hasSubmission: mySubmissionId != null,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    console.error("factory-stats error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
