import { NextResponse } from "next/server";
import { getQuestionsSync } from "@/lib/audit-questions-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const list = await prisma.submission.findMany({
      select: { id: true, userId: true, answers: true, createdAt: true },
    });

    const questions = getQuestionsSync();
    const totalQuestions = questions.length;

    let factories = list.map((entry) => {
      const answers = (entry.answers as Record<string, string>) || {};
      const answeredCount = totalQuestions
        ? questions.filter((q) => {
            const v = answers[q.id];
            return v != null && String(v).trim() !== "";
          }).length
        : 0;
      const transparencyScore =
        totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
      return {
        id: entry.id,
        createdAt: entry.createdAt.toISOString(),
        name: answers.q1 || "Unnamed factory",
        address: answers.q2,
        expertise: answers.q3,
        transparencyScore,
      };
    });

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    if (idsParam && typeof idsParam === "string") {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        const idSet = new Set(ids);
        factories = factories.filter((f) => idSet.has(f.id));
      }
    }

    return NextResponse.json(factories, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("factories list error", e);
    return NextResponse.json([], { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
