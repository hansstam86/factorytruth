import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

export async function GET() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as {
      id: string;
      userId?: string;
      answers: Record<string, string>;
      visibility?: Record<string, "public" | "private">;
      createdAt: string;
    }[];

    const factories = list.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      name: entry.answers.q1 || "Unnamed factory",
      address: entry.answers.q2,
      expertise: entry.answers.q3,
    }));

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
