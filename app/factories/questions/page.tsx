"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type FactoryQuestion = {
  id: string;
  submissionId: string;
  entrepreneurEmail: string;
  entrepreneurName?: string;
  questionText: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
};

export default function FactoryQuestionsPage() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<FactoryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch("/api/my-submission", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { submission: null }))
      .then((data) => {
        const id = data?.submission?.id ?? null;
        setSubmissionId(id);
        if (!id) {
          setLoading(false);
          return;
        }
        return fetch(`/api/factory-questions?submissionId=${encodeURIComponent(id)}`, {
          credentials: "include",
        });
      })
      .then((res) => {
        if (!res || !res.ok) return [];
        return res.json();
      })
      .then((list) => {
        setQuestions(Array.isArray(list) ? list : []);
        setAnswerDraft((prev) => {
          const next = { ...prev };
          list.forEach((q: FactoryQuestion) => {
            if (q.answer != null && next[q.id] === undefined) next[q.id] = q.answer;
          });
          return next;
        });
      })
      .catch(() => {
        setQuestions([]);
        setError("加载失败，请稍后重试。");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAnswer = async (id: string) => {
    const text = answerDraft[id] ?? "";
    setSavingId(id);
    try {
      const res = await fetch(`/api/factory-questions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer: text }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, answer: text, answeredAt: new Date().toISOString() } : q
          )
        );
      }
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className={styles.loading}>加载中…</p>;

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>{error}</p>
        <Link href="/factories">返回提交审核</Link>
      </div>
    );
  }

  if (!submissionId) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>创业者提问</h1>
        <p className={styles.desc}>请先提交审核答案后，创业者对您工厂的提问会显示在这里。</p>
        <Link href="/factories" className={styles.link}>去提交审核</Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>创业者提问</h1>
      <p className={styles.desc}>
        创业者在查看您工厂页面时可以提出具体问题。请在下方回复，他们会在工厂页面看到您的回答。
      </p>

      {questions.length === 0 ? (
        <p className={styles.empty}>暂无提问。创业者在您工厂页面可以「Ask a question」向您提问。</p>
      ) : (
        <ul className={styles.list}>
          {questions.map((q) => (
            <li key={q.id} className={styles.card}>
              <div className={styles.cardSection}>
                <p className={styles.questionLabel}>提问人</p>
                <p className={styles.questionMeta}>{q.entrepreneurName || "—"} ({q.entrepreneurEmail})</p>
                <p className={styles.questionMeta}>提问时间：{new Date(q.createdAt).toLocaleString("zh-CN")}</p>
              </div>
              <div className={styles.cardSection}>
                <p className={styles.questionLabel}>问题</p>
                <p className={styles.questionText}>{q.questionText}</p>
              </div>
              <div className={styles.cardSection}>
                <p className={styles.questionLabel}>您的回复</p>
                <textarea
                  value={answerDraft[q.id] ?? q.answer ?? ""}
                  onChange={(e) => setAnswerDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="输入回复内容…"
                  rows={3}
                  className={styles.answerInput}
                />
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => handleSaveAnswer(q.id)}
                  disabled={savingId === q.id}
                >
                  {savingId === q.id ? "保存中…" : "保存回复"}
                </button>
                {q.answeredAt && (
                  <p className={styles.answeredAt}>已回复于 {new Date(q.answeredAt).toLocaleString("zh-CN")}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.back}>
        <Link href="/factories">返回提交审核</Link>
      </p>
    </div>
  );
}
