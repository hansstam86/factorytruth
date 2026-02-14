import { NextResponse } from "next/server";
import { getQuestionsSync } from "@/lib/audit-questions-server";

export const dynamic = "force-dynamic";

/** Public: returns current audit questions (from JSON if set by admin, else default). */
export async function GET() {
  try {
    const questions = getQuestionsSync();
    return NextResponse.json(questions);
  } catch (e) {
    console.error("questions GET error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
