import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getQuestionsSync } from "@/lib/audit-questions-server";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

export async function GET(request: Request) {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      visibility?: Record<string, "public" | "private">;
      createdAt: string;
    }[];

    const questions = getQuestionsSync();
    const totalQuestions = questions.length;

    let factories = list.map((entry) => {
      const answers = entry.answers || {};
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
        createdAt: entry.createdAt,
        name: entry.answers.q1 || "Unnamed factory",
        address: entry.answers.q2,
        expertise: entry.answers.q3,
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
