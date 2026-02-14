"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type QuestionType = "text" | "textarea" | "yesno" | "file" | "files";

type AuditQuestion = {
  id: string;
  section: string;
  sectionEn: string;
  questionZh: string;
  questionEn: string;
  type: QuestionType;
};

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/admin/login");
          return;
        }
        return fetch("/api/admin/questions", { credentials: "include" });
      })
      .then((res) => {
        if (!res || !res.ok) return [];
        return res.json();
      })
      .then((list) => {
        setQuestions(Array.isArray(list) ? list : []);
      })
      .catch(() => setError("Failed to load questions."))
      .finally(() => setLoading(false));
  }, [router]);

  const updateQuestion = (index: number, field: keyof AuditQuestion, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(questions),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed.");
        return;
      }
      setMessage(`Saved ${questions.length} questions. They will appear on the factory form and entrepreneur view.`);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading questions…</p>;
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Edit audit questions</h1>
      <p className={styles.desc}>
        Changes are stored in <code>data/audit-questions.json</code> and used by the factory form and entrepreneur pages. Question IDs (e.g. q1, A1) should not be changed to avoid breaking existing submissions.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.toolbar}>
        <button type="button" onClick={handleSave} className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : "Save all"}
        </button>
      </div>

      <div className={styles.list}>
        {questions.map((q, i) => (
          <div key={q.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.qId}>{q.id}</span>
              <select
                value={q.type}
                onChange={(e) => updateQuestion(i, "type", e.target.value as QuestionType)}
                className={styles.typeSelect}
              >
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="yesno">yesno</option>
                <option value="file">file</option>
                <option value="files">files</option>
              </select>
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Section (ZH)</label>
                <input
                  value={q.section}
                  onChange={(e) => updateQuestion(i, "section", e.target.value)}
                  placeholder="Section name"
                />
              </div>
              <div className={styles.field}>
                <label>Section (EN)</label>
                <input
                  value={q.sectionEn}
                  onChange={(e) => updateQuestion(i, "sectionEn", e.target.value)}
                  placeholder="Section name"
                />
              </div>
              <div className={styles.fieldFull}>
                <label>Question (Chinese)</label>
                <input
                  value={q.questionZh}
                  onChange={(e) => updateQuestion(i, "questionZh", e.target.value)}
                  placeholder="Chinese label"
                />
              </div>
              <div className={styles.fieldFull}>
                <label>Question (English)</label>
                <input
                  value={q.questionEn}
                  onChange={(e) => updateQuestion(i, "questionEn", e.target.value)}
                  placeholder="English label"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && !loading && (
        <p className={styles.empty}>
          No questions loaded. Ensure <code>data/audit-questions.json</code> exists or the API returns the default set.
        </p>
      )}

      <p className={styles.back}>
        <Link href="/admin">← Dashboard</Link>
      </p>
    </div>
  );
}
