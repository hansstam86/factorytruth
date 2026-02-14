import { readFileSync, existsSync } from "fs";
import path from "path";
import { AUDIT_QUESTIONS, type AuditQuestion, type QuestionType } from "./audit-questions";

const DATA_FILE = path.join(process.cwd(), "data", "audit-questions.json");

function isValidQuestion(q: unknown): q is AuditQuestion {
  return (
    typeof q === "object" &&
    q !== null &&
    "id" in q &&
    "section" in q &&
    "sectionEn" in q &&
    "questionZh" in q &&
    "questionEn" in q &&
    "type" in q &&
    typeof (q as AuditQuestion).id === "string" &&
    typeof (q as AuditQuestion).section === "string" &&
    typeof (q as AuditQuestion).sectionEn === "string" &&
    typeof (q as AuditQuestion).questionZh === "string" &&
    typeof (q as AuditQuestion).questionEn === "string" &&
    ["text", "textarea", "yesno", "file", "files"].includes((q as AuditQuestion).type as QuestionType)
  );
}

/** Server-only: returns questions from data/audit-questions.json if present, else default. */
export function getQuestionsSync(): AuditQuestion[] {
  try {
    if (!existsSync(DATA_FILE)) return AUDIT_QUESTIONS;
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return AUDIT_QUESTIONS;
    const filtered = parsed.filter(isValidQuestion);
    return filtered.length > 0 ? filtered : AUDIT_QUESTIONS;
  } catch {
    return AUDIT_QUESTIONS;
  }
}

export function getQuestionsFilePath(): string {
  return DATA_FILE;
}
