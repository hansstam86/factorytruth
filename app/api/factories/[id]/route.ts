import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { verifySession as verifyEntrepreneurSession, getSessionCookieName as getEntrepreneurSessionCookieName } from "@/lib/entrepreneur-auth";
import { getQuestionsSync } from "@/lib/audit-questions-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await prisma.submission.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const answers = (entry.answers as Record<string, string>) ?? {};
    const answersEn = (entry.answersEn as Record<string, string>) ?? {};
    const visibility = (entry.visibility as Record<string, "public" | "private">) ?? {};

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
        const grants = await prisma.accessGrant.findMany({
          where: { submissionId: id, entrepreneurEmail: session.email },
        });
        if (grants.length > 0) {
          const merged = grants.flatMap((g) => (g.questionIds as string[]) ?? []);
          grantedQuestionIds = merged.includes("all") ? ["all"] : Array.from(new Set(merged));
        }
      }
    }

    const canSee = (qId: string) => {
      if (visibility[qId] !== "private") return true;
      if (grantedQuestionIds.includes("all")) return true;
      return grantedQuestionIds.includes(qId);
    };

    const sourceAnswers = isFactoryOwner
      ? answers
      : { ...answers, ...answersEn };
    const filteredAnswers: Record<string, string> = {};
    for (const [qId, value] of Object.entries(answers)) {
      if (canSee(qId)) {
        filteredAnswers[qId] = sourceAnswers[qId] ?? value;
      }
    }

    const questions = getQuestionsSync();
    const totalQuestions = questions.length;
    const answeredCount = totalQuestions
      ? questions.filter((q) => {
          const v = answers[q.id];
          return v != null && String(v).trim() !== "";
        }).length
      : 0;
    const transparencyScore = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    let rankPercentile: number | null = null;
    let accessRequestCount = 0;
    try {
      const list = await prisma.submission.findMany({
        select: { id: true, answers: true },
      });
      const allScores = list.map((e) => {
        const ans = (e.answers as Record<string, string>) || {};
        const n = totalQuestions ? questions.filter((q) => ans[q.id] != null && String(ans[q.id]).trim() !== "").length : 0;
        return totalQuestions > 0 ? Math.round((n / totalQuestions) * 100) : 0;
      });
      const totalFactories = allScores.length;
      const withLowerScore = allScores.filter((s) => s < transparencyScore).length;
      rankPercentile = totalFactories > 1 ? Math.round((withLowerScore / totalFactories) * 100) : 100;

      accessRequestCount = await prisma.accessRequest.count({
        where: { submissionId: id },
      });
    } catch {
      // optional stats
    }

    const questionsEn = Object.fromEntries(questions.map((q) => [q.id, q.questionEn]));
    const questionsList = questions.map((q) => ({ id: q.id, sectionEn: q.sectionEn, questionEn: q.questionEn }));

    return NextResponse.json({
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      name: answers.q1 || "Unnamed factory",
      address: answers.q2,
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
