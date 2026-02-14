import { NextResponse } from "next/server";
import { readFile, writeFile, rm } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REQUESTS_FILE = path.join(DATA_DIR, "access-requests.json");
const GRANTS_FILE = path.join(DATA_DIR, "access-grants.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** DELETE — remove a factory (submission, user account, related data). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const { id: submissionId } = await params;
    if (!submissionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const submissionsRaw = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsRaw) as { id: string; userId?: string }[];
    const entry = submissions.find((s) => s.id === submissionId);
    if (!entry) return NextResponse.json({ error: "Factory not found" }, { status: 404 });

    const userId = entry.userId;

    const newSubmissions = submissions.filter((s) => s.id !== submissionId);
    await writeFile(SUBMISSIONS_FILE, JSON.stringify(newSubmissions, null, 2), "utf-8");

    if (userId) {
      let users: { email: string; passwordHash: string }[] = [];
      try {
        users = JSON.parse(await readFile(USERS_FILE, "utf-8"));
      } catch {
        // no users file
      }
      users = users.filter((u) => u.email !== userId);
      await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    }

    try {
      const requests = JSON.parse(await readFile(REQUESTS_FILE, "utf-8")) as { submissionId: string }[];
      const newRequests = requests.filter((r) => r.submissionId !== submissionId);
      await writeFile(REQUESTS_FILE, JSON.stringify(newRequests, null, 2), "utf-8");
    } catch {
      // no requests file
    }

    try {
      const grants = JSON.parse(await readFile(GRANTS_FILE, "utf-8")) as { submissionId: string }[];
      const newGrants = grants.filter((g) => g.submissionId !== submissionId);
      await writeFile(GRANTS_FILE, JSON.stringify(newGrants, null, 2), "utf-8");
    } catch {
      // no grants file
    }

    const uploadsPath = path.join(UPLOADS_DIR, submissionId);
    try {
      await rm(uploadsPath, { recursive: true });
    } catch {
      // folder may not exist
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin factories DELETE error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
