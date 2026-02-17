/**
 * Seed / migrate existing data from data/*.json into PostgreSQL.
 * Run: npx prisma db seed
 * Requires DATABASE_URL in .env.local (or .env).
 */
import "dotenv/config";
import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { prisma } from "../lib/db";

const dataDir = resolve(process.cwd(), "data");

function loadJson<T>(file: string, defaultVal: T): T {
  const path = resolve(dataDir, file);
  if (!existsSync(path)) return defaultVal;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return defaultVal;
  }
}

async function main() {
  type UserRow = { email: string; passwordHash: string };
  type EntrepreneurRow = { email: string; passwordHash?: string; name?: string; googleId?: string };
  type SubmissionRow = {
    id: string;
    userId?: string;
    answers: Record<string, string>;
    answersEn?: Record<string, string>;
    visibility?: Record<string, string>;
    createdAt: string;
    updatedAt?: string;
  };
  type AccessRequestRow = {
    id: string;
    submissionId: string;
    entrepreneurEmail: string;
    entrepreneurName?: string;
    questionIds: string[];
    status: string;
    createdAt: string;
    respondedAt?: string;
  };
  type AccessGrantRow = {
    submissionId: string;
    entrepreneurEmail: string;
    questionIds: string[];
    grantedAt: string;
  };
  type FactoryQuestionRow = {
    id: string;
    submissionId: string;
    entrepreneurEmail: string;
    questionText: string;
    answer?: string;
    createdAt: string;
    answeredAt?: string;
  };

  if (existsSync(resolve(process.cwd(), ".env.local"))) {
    config({ path: resolve(process.cwd(), ".env.local"), override: true });
  }

  const users = loadJson<UserRow[]>("users.json", []);
  const entrepreneurUsers = loadJson<EntrepreneurRow[]>("entrepreneur-users.json", []);
  const submissions = loadJson<SubmissionRow[]>("submissions.json", []);
  const accessRequests = loadJson<AccessRequestRow[]>("access-requests.json", []);
  const accessGrants = loadJson<AccessGrantRow[]>("access-grants.json", []);
  const factoryQuestions = loadJson<FactoryQuestionRow[]>("factory-questions.json", []);

  for (const u of users) {
    if (!u.email?.trim()) continue;
    await prisma.user.upsert({
      where: { email: u.email.trim().toLowerCase() },
      create: {
        email: u.email.trim().toLowerCase(),
        passwordHash: u.passwordHash,
      },
      update: { passwordHash: u.passwordHash },
    });
  }
  console.log(`Seeded ${users.length} factory user(s).`);

  for (const u of entrepreneurUsers) {
    if (!u.email?.trim()) continue;
    await prisma.entrepreneurUser.upsert({
      where: { email: u.email.trim().toLowerCase() },
      create: {
        email: u.email.trim().toLowerCase(),
        passwordHash: u.passwordHash ?? null,
        name: u.name ?? null,
        googleId: u.googleId ?? null,
      },
      update: {
        passwordHash: u.passwordHash ?? undefined,
        name: u.name ?? undefined,
        googleId: u.googleId ?? undefined,
      },
    });
  }
  console.log(`Seeded ${entrepreneurUsers.length} entrepreneur user(s).`);

  for (const s of submissions) {
    if (!s.id) continue;
    await prisma.submission.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        userId: s.userId ?? "",
        answers: (s.answers ?? {}) as object,
        answersEn: (s.answersEn ?? undefined) as object | undefined,
        visibility: (s.visibility ?? undefined) as object | undefined,
        createdAt: new Date(s.createdAt),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
      },
      update: {
        userId: s.userId ?? undefined,
        answers: (s.answers ?? {}) as object,
        answersEn: (s.answersEn ?? undefined) as object | undefined,
        visibility: (s.visibility ?? undefined) as object | undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
      },
    });
  }
  console.log(`Seeded ${submissions.length} submission(s).`);

  for (const r of accessRequests) {
    if (!r.id) continue;
    await prisma.accessRequest.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        submissionId: r.submissionId,
        entrepreneurEmail: r.entrepreneurEmail,
        entrepreneurName: r.entrepreneurName ?? null,
        questionIds: (r.questionIds ?? []) as object,
        status: r.status ?? "pending",
        createdAt: new Date(r.createdAt),
        respondedAt: r.respondedAt ? new Date(r.respondedAt) : null,
      },
      update: {
        status: r.status ?? undefined,
        respondedAt: r.respondedAt ? new Date(r.respondedAt) : undefined,
      },
    });
  }
  console.log(`Seeded ${accessRequests.length} access request(s).`);

  if (accessGrants.length > 0) {
    const subIds = [...new Set(accessGrants.map((g) => g.submissionId))];
    await prisma.accessGrant.deleteMany({
      where: { submissionId: { in: subIds } },
    });
    for (const g of accessGrants) {
      await prisma.accessGrant.create({
        data: {
          submissionId: g.submissionId,
          entrepreneurEmail: g.entrepreneurEmail,
          questionIds: (g.questionIds ?? []) as object,
          grantedAt: new Date(g.grantedAt),
        },
      });
    }
    console.log(`Seeded ${accessGrants.length} access grant(s).`);
  }

  for (const q of factoryQuestions) {
    if (!q.id) continue;
    await prisma.factoryQuestion.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        submissionId: q.submissionId,
        entrepreneurEmail: q.entrepreneurEmail,
        questionText: q.questionText,
        answer: q.answer ?? null,
        createdAt: new Date(q.createdAt),
        answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
      },
      update: {
        answer: q.answer ?? undefined,
        answeredAt: q.answeredAt ? new Date(q.answeredAt) : undefined,
      },
    });
  }
  if (factoryQuestions.length) console.log(`Seeded ${factoryQuestions.length} factory question(s).`);

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
