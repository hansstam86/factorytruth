"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { AUDIT_QUESTIONS } from "@/lib/audit-questions";
import { getCompareIds, addToCompare, removeFromCompare, COMPARE_MAX } from "@/lib/compare-factories";
import { getShortlistIds, toggleShortlist } from "@/lib/shortlist";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

function isImagePath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function fileUrl(submissionId: string, path: string): string {
  return `/api/submission-file?submissionId=${encodeURIComponent(submissionId)}&path=${encodeURIComponent(path)}`;
}

type FactoryDetail = {
  id: string;
  name: string;
  answers: Record<string, string>;
  visibility?: Record<string, "public" | "private">;
  questionsEn: Record<string, string>;
  questions?: { id: string; sectionEn: string; questionEn: string }[];
  createdAt: string;
  privateQuestionIds?: string[];
};

function formatValue(value: string, submissionId: string): React.ReactNode {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value.startsWith("uploads/")) {
    const name = value.split("/").pop() || "Download";
    const url = fileUrl(submissionId, value);
    if (isImagePath(value)) {
      return (
        <span className={styles.fileBlock}>
          <img src={url} alt={name} className={styles.inlineImage} />
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
            Open in new tab
          </a>
        </span>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
        {name}
      </a>
    );
  }
  try {
    const arr = JSON.parse(value) as { path: string; name: string }[];
    if (Array.isArray(arr)) {
      return (
        <span className={styles.fileList}>
          {arr.map((f, i) => {
            const url = fileUrl(submissionId, f.path);
            const label = f.name || f.path.split("/").pop() || "File";
            if (isImagePath(f.path)) {
              return (
                <span key={i} className={styles.fileBlock}>
                  <img src={url} alt={label} className={styles.inlineImage} />
                  <a href={url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                    Open in new tab
                  </a>
                </span>
              );
            }
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileLink}
              >
                {label}
              </a>
            );
          })}
        </span>
      );
    }
  } catch {
    // not JSON
  }
  return value;
}

export default function FactoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [factory, setFactory] = useState<FactoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [entrepreneurUser, setEntrepreneurUser] = useState<{ email: string } | null>(null);
  const [customQuestions, setCustomQuestions] = useState<{ id: string; questionText: string; answer?: string; answeredAt?: string; createdAt: string }[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const [inShortlist, setInShortlist] = useState(false);

  useEffect(() => {
    const ids = getCompareIds();
    setInCompare(ids.includes(id));
    setCompareCount(ids.length);
    setInShortlist(getShortlistIds().includes(id));
  }, [id]);

  useEffect(() => {
    fetch("/api/entrepreneur-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setEntrepreneurUser(data.user ?? null))
      .catch(() => setEntrepreneurUser(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/factories/${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((f) => setFactory(f ?? null))
      .catch(() => setFactory(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !entrepreneurUser) {
      setCustomQuestions([]);
      return;
    }
    fetch(`/api/factory-questions?submissionId=${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setCustomQuestions(Array.isArray(list) ? list : []))
      .catch(() => setCustomQuestions([]));
  }, [id, entrepreneurUser]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factory || !questionInput.trim()) return;
    setQuestionSubmitting(true);
    try {
      const res = await fetch("/api/factory-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submissionId: factory.id, questionText: questionInput.trim() }),
      });
      if (res.ok) {
        setQuestionInput("");
        const list = await fetch(`/api/factory-questions?submissionId=${encodeURIComponent(factory.id)}`, { credentials: "include" }).then((r) => r.json());
        setCustomQuestions(Array.isArray(list) ? list : []);
      }
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!factory?.privateQuestionIds?.length) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          submissionId: factory.id,
          questionIds: factory.privateQuestionIds,
        }),
      });
      if (res.ok) {
        setRequestSent(true);
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading…</p>;
  }
  if (!factory) {
    return (
      <div className={styles.notFound}>
        <p>Factory not found.</p>
        <Link href="/entrepreneurs">← Back to factories</Link>
      </div>
    );
  }

  const answers = factory.answers || {};
  const labelsEn = factory.questionsEn || {};
  const privateIds = new Set(factory.privateQuestionIds || []);
  const bySection = new Map<string, { id: string; label: string; value: string; isPrivate?: boolean }[]>();

  const questionList = factory.questions && factory.questions.length > 0
    ? factory.questions
    : AUDIT_QUESTIONS.map((q) => ({ id: q.id, sectionEn: q.sectionEn, questionEn: q.questionEn }));

  for (const q of questionList) {
    const label = labelsEn[q.id] ?? q.questionEn;
    if (!bySection.has(q.sectionEn)) {
      bySection.set(q.sectionEn, []);
    }
    const value = answers[q.id];
    if (value != null && String(value).trim() !== "") {
      bySection.get(q.sectionEn)!.push({ id: q.id, label, value });
    } else if (privateIds.has(q.id)) {
      bySection.get(q.sectionEn)!.push({ id: q.id, label, value: "", isPrivate: true });
    }
  }

  const hasPrivate = factory.privateQuestionIds && factory.privateQuestionIds.length > 0;

  const totalQuestions = questionList.length;
  const answeredCount = questionList.filter((q) => {
    const v = answers[q.id];
    return v != null && String(v).trim() !== "";
  }).length;
  const transparencyPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className={styles.detailWrap}>
      <Link href="/entrepreneurs" className={styles.backLink}>
        ← Back to factories
      </Link>

      <header className={styles.detailHeader}>
        <h1 className={styles.detailName}>{factory.name}</h1>
        <p className={styles.detailDate}>
          Submitted {new Date(factory.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className={styles.compareActions}>
          <button
            type="button"
            className={styles.shortlistBtn}
            title={inShortlist ? "Remove from shortlist" : "Save to shortlist"}
            onClick={() => {
              toggleShortlist(factory.id);
              setInShortlist(getShortlistIds().includes(factory.id));
            }}
          >
            {inShortlist ? "★ In shortlist" : "☆ Save to shortlist"}
          </button>
          {inCompare ? (
            <button
              type="button"
              className={styles.compareBtn}
              onClick={() => {
                removeFromCompare(factory.id);
                setInCompare(false);
                setCompareCount((c) => c - 1);
              }}
            >
              Remove from comparison
            </button>
          ) : compareCount < COMPARE_MAX ? (
            <button
              type="button"
              className={styles.compareBtn}
              onClick={() => {
                addToCompare(factory.id);
                setInCompare(true);
                setCompareCount((c) => c + 1);
              }}
            >
              Add to comparison
            </button>
          ) : (
            <span className={styles.compareFull}>
              Comparison list full ({COMPARE_MAX} factories). Remove one from the <Link href="/entrepreneurs">browse page</Link> or <Link href="/entrepreneurs/compare">compare page</Link>.
            </span>
          )}
          {compareCount >= 2 && (
            <Link href={`/entrepreneurs/compare?ids=${getCompareIds().join(",")}`} className={styles.compareLink}>
              Compare {compareCount} factories →
            </Link>
          )}
        </div>
      </header>

      <div className={styles.whyBlock}>
        <h2 className={styles.whyTitle}>Why this factory?</h2>
        <p className={styles.whyDesc}>
          This factory shared <strong>{answeredCount} of {totalQuestions}</strong> audit answers
          {totalQuestions > 0 && (
            <> — a <strong>transparency score of {transparencyPct}%</strong></>
          )}.
          The more factories share, the easier it is to compare and choose partners you can trust for your production.
        </p>
      </div>

      <section className={styles.detailSection}>
        <h2>Audit answers</h2>
        {Array.from(bySection.entries()).map(([sectionName, rows]) => (
          <div key={sectionName} className={styles.detailBlock}>
            <h3 className={styles.detailSectionTitle}>{sectionName}</h3>
            <dl className={styles.detailDl}>
              {rows.map(({ id: qId, label, value, isPrivate }) => (
                <div key={qId} className={styles.detailRow}>
                  <dt>{label}</dt>
                  <dd>
                    {isPrivate ? (
                      <span className={styles.privateAnswer}>
                        This answer is not shared publicly.
                        {requestSent ? (
                          " Access requested. The factory will be notified."
                        ) : (
                          <> Log in and click &quot;Request access to private answers&quot; below to ask the factory to share it.</>
                        )}
                      </span>
                    ) : (
                      formatValue(value, factory.id)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      {hasPrivate && !requestSent && (
        <div className={styles.requestBlock}>
          {entrepreneurUser ? (
            <>
              <button
                type="button"
                className={styles.requestBtn}
                onClick={handleRequestAccess}
                disabled={requesting}
              >
                {requesting ? "Sending…" : "Request access to private answers"}
              </button>
              <p className={styles.requestHint}>
                The factory will be notified and can approve or deny your request.
              </p>
            </>
          ) : (
            <p className={styles.requestHint}>
              <Link href="/entrepreneurs/login">Log in</Link> to request access to private answers.
            </p>
          )}
        </div>
      )}

      <section className={styles.customQuestionsSection}>
        <h2 className={styles.detailSectionTitle}>Questions for this factory</h2>
        {entrepreneurUser ? (
          <>
            <form onSubmit={handleAskQuestion} className={styles.askForm}>
              <textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask a specific question (e.g. lead time, MOQ, certifications…)"
                rows={3}
                className={styles.askInput}
                required
              />
              <button type="submit" className={styles.askBtn} disabled={questionSubmitting}>
                {questionSubmitting ? "Sending…" : "Send question"}
              </button>
            </form>
            {customQuestions.length > 0 && (
              <div className={styles.yourQuestions}>
                <h3 className={styles.yourQuestionsTitle}>Your questions</h3>
                <ul className={styles.questionList}>
                  {customQuestions.map((q) => (
                    <li key={q.id} className={styles.questionCard}>
                      <p className={styles.questionText}>{q.questionText}</p>
                      <p className={styles.questionMeta}>
                        Asked {new Date(q.createdAt).toLocaleDateString()}
                        {q.answeredAt && " · Answered"}
                      </p>
                      {q.answer != null && q.answer !== "" && (
                        <div className={styles.answerBlock}>
                          <strong>Factory reply:</strong> {q.answer}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className={styles.requestHint}>
            <Link href="/entrepreneurs/login">Log in</Link> to ask this factory a question.
          </p>
        )}
      </section>

      <div className={styles.detailActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => {
            const subject = encodeURIComponent(`Factory inquiry: ${factory.name}`);
            const body = encodeURIComponent(
              `I found your factory on Factory Truth and would like to discuss a potential order.\n\nFactory: ${factory.name}\nID: ${factory.id}`
            );
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
          }}
        >
          Contact this factory
        </button>
      </div>
    </div>
  );
}
