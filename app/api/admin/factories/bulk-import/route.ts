import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

const MAX_NAMES = 2000;

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** POST — add many factory names as minimal submissions (name only, no account). */
export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const raw = body.names;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "Body must be { names: string[] }." }, { status: 400 });
    }

    const names = raw
      .map((n: unknown) => (typeof n === "string" ? n.trim() : String(n).trim()))
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      return NextResponse.json({ error: "No valid names provided." }, { status: 400 });
    }
    if (names.length > MAX_NAMES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_NAMES} names per request. You sent ${names.length}.` },
        { status: 400 }
      );
    }

    let list: { id: string; answers: Record<string, string>; createdAt: string }[] = [];
    try {
      const rawFile = await readFile(SUBMISSIONS_FILE, "utf-8");
      list = JSON.parse(rawFile);
    } catch {
      await mkdir(DATA_DIR, { recursive: true });
    }

    const existingNames = new Set(
      list.map((e) => (e.answers?.q1 || "").trim().toLowerCase())
    );
    const toAdd = names.filter((n) => !existingNames.has(n.toLowerCase()));
    const skipped = names.length - toAdd.length;

    const now = new Date().toISOString();
    const newEntries = toAdd.map((name) => ({
      id: randomUUID(),
      answers: { q1: name, q2: "" },
      createdAt: now,
    }));

    list.push(...newEntries);
    await writeFile(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");

    return NextResponse.json({
      added: newEntries.length,
      skipped,
      total: list.length,
    });
  } catch (e) {
    console.error("admin bulk-import error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
