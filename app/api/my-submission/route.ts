import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ submission: null }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ submission: null }, { status: 401 });
    }
    const userId = session.email;

    const raw = await readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      visibility?: Record<string, "public" | "private">;
      createdAt: string;
      updatedAt?: string;
    }[];

    const mine = list.find((s) => s.userId === userId);
    if (!mine) {
      return NextResponse.json({ submission: null }, { status: 200 });
    }
    return NextResponse.json({
      submission: {
        id: mine.id,
        answers: mine.answers,
        visibility: mine.visibility ?? {},
        createdAt: mine.createdAt,
        updatedAt: mine.updatedAt,
      },
    });
  } catch (e) {
    console.error("my-submission error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
