import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

const MAX_ROWS = 50000;
const BULK_IMPORT_PLACEHOLDER_EMAIL =
  (process.env.BULK_IMPORT_PLACEHOLDER_EMAIL || "hans.stam@gmail.com").trim().toLowerCase();

type BulkRow = { name: string; address?: string; expertise?: string };

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function normalizeRow(r: BulkRow): { name: string; address: string; expertise: string } {
  return {
    name: (r.name ?? "").trim(),
    address: (r.address ?? "").trim(),
    expertise: (r.expertise ?? "").trim(),
  };
}

/** POST — add many factories. Body: { names: string[] } or { rows: { name, address?, expertise? }[] }. */
export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    let rows: { name: string; address: string; expertise: string }[] = [];

    if (Array.isArray(body.rows)) {
      rows = body.rows
        .map((r: unknown) => {
          if (typeof r !== "object" || r === null) return null;
          const o = r as Record<string, unknown>;
          const name = typeof o.name === "string" ? o.name.trim() : String(o.name ?? "").trim();
          if (!name) return null;
          return normalizeRow({
            name,
            address: typeof o.address === "string" ? o.address : String(o.address ?? ""),
            expertise: typeof o.expertise === "string" ? o.expertise : String(o.expertise ?? ""),
          });
        })
        .filter((r): r is { name: string; address: string; expertise: string } => r !== null);
    } else if (Array.isArray(body.names)) {
      rows = body.names
        .map((n: unknown) => (typeof n === "string" ? n.trim() : String(n).trim()))
        .filter((n) => n.length > 0)
        .map((name) => normalizeRow({ name }));
    } else {
      return NextResponse.json(
        { error: "Body must be { names: string[] } or { rows: { name, address?, expertise? }[] }." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows provided." }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} rows per request. You sent ${rows.length}.` },
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
    const toAdd = rows.filter((r) => !existingNames.has(r.name.toLowerCase()));
    const skipped = rows.length - toAdd.length;

    const now = new Date().toISOString();
    const newEntries = toAdd.map((r) => ({
      id: randomUUID(),
      userId: BULK_IMPORT_PLACEHOLDER_EMAIL,
      answers: { q1: r.name, q2: r.address, q3: r.expertise },
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
