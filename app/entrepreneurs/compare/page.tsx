"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getCompareIds } from "@/lib/compare-factories";
import { getShortlistIds, addToShortlist } from "@/lib/shortlist";
import { AUDIT_QUESTIONS } from "@/lib/audit-questions";

type FactoryDetail = {
  id: string;
  name: string;
  address?: string;
  answers: Record<string, string>;
  questionsEn: Record<string, string>;
  questions?: { id: string; sectionEn: string; questionEn: string }[];
  privateQuestionIds?: string[];
};

function fileUrl(submissionId: string, path: string): string {
  return `/api/submission-file?submissionId=${encodeURIComponent(submissionId)}&path=${encodeURIComponent(path)}`;
}

/** Short label for table cell: text, yes/no, or file link(s). */
function cellSummary(value: string, submissionId: string): React.ReactNode {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value.startsWith("uploads/")) {
    const url = fileUrl(submissionId, value);
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.cellFileLink}>
        File
      </a>
    );
  }
  try {
    const arr = JSON.parse(value) as { path: string }[];
    if (Array.isArray(arr)) {
      const url = arr[0] ? fileUrl(submissionId, arr[0].path) : "#";
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.cellFileLink}>
          {arr.length} file{arr.length !== 1 ? "s" : ""}
        </a>
      );
    }
  } catch {
    // not JSON
  }
  const text = String(value).trim();
  if (text.length <= 120) return text;
  return (
    <span title={text}>
      {text.slice(0, 120).trim()}…
    </span>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [factories, setFactories] = useState<FactoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const idsParam = searchParams.get("ids");
  const ids = useMemo(() => {
    if (idsParam) {
      return idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return getCompareIds();
  }, [idsParam]);

  // Sync URL with localStorage when opening without ?ids= so the link is shareable
  useEffect(() => {
    if (idsParam || ids.length < 2) return;
    router.replace(`/entrepreneurs/compare?ids=${ids.join(",")}`, { scroll: false });
  }, [idsParam, ids.length, ids.join(","), router]);

  useEffect(() => {
    if (ids.length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      ids.map((id) =>
        fetch(`/api/factories/${encodeURIComponent(id)}`, { credentials: "include" }).then(
          (res) => (res.ok ? res.json() : null)
        )
      )
    )
      .then((results) => {
        const loaded = results.filter((f): f is FactoryDetail => f != null);
        if (loaded.length !== ids.length) {
          setError("Some factories could not be loaded (not found or no access).");
        }
        setFactories(loaded);
      })
      .catch(() => setError("Failed to load factory data."))
      .finally(() => setLoading(false));
  }, [ids.join(","), retryTrigger]);

  useEffect(() => {
    setShortlistIds(getShortlistIds());
    const onStorage = () => setShortlistIds(getShortlistIds());
    window.addEventListener("storage", onStorage);
    window.addEventListener("factorytruth-shortlist-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("factorytruth-shortlist-change", onStorage);
    };
  }, []);

  const handleAddAllToShortlist = () => {
    factories.forEach((f) => addToShortlist(f.id));
    setShortlistIds(getShortlistIds());
  };

  const notInShortlist = factories.filter((f) => !shortlistIds.includes(f.id));
  const allInShortlist = notInShortlist.length === 0 && factories.length > 0;

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // Build ordered list of (section, questionId, questionEn) from first factory's questions or default audit list
  const questionRows = useMemo(() => {
    if (factories.length === 0) return [];
    const f = factories[0];
    const questions =
      f.questions && f.questions.length > 0
        ? f.questions
        : AUDIT_QUESTIONS.map((q) => ({ id: q.id, sectionEn: q.sectionEn, questionEn: q.questionEn }));
    const out: { sectionEn: string; id: string; questionEn: string }[] = [];
    let lastSection = "";
    for (const q of questions) {
      if (q.sectionEn && q.sectionEn !== lastSection) {
        lastSection = q.sectionEn;
        out.push({ sectionEn: q.sectionEn, id: `section-${q.sectionEn}`, questionEn: "" });
      }
      if (q.id) {
        out.push({ sectionEn: q.sectionEn, id: q.id, questionEn: q.questionEn });
      }
    }
    return out;
  }, [factories]);

  if (ids.length < 2 && !loading) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Compare factories</h1>
        <p className={styles.needMore}>
          Select at least 2 factories to compare their answers side by side. Go to{" "}
          <Link href="/entrepreneurs">Browse factories</Link> and check &quot;Compare&quot; on the factories you want, then click &quot;Compare side by side&quot;.
        </p>
        <p className={styles.backWrap}>
          <Link href="/entrepreneurs">← Back to factories</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap} aria-busy="true" aria-label="Loading comparison">
        <h1 className={styles.title}>Compare factories</h1>
        <div className={styles.tableScroll}>
          <table className={styles.skeletonTable}>
            <thead>
              <tr>
                <th className={styles.thQuestion}><div className={styles.skeletonCell} /></th>
                <th className={styles.thFactory}><div className={styles.skeletonCell} /></th>
                <th className={styles.thFactory}><div className={styles.skeletonCell} /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className={styles.tdQuestion}><div className={styles.skeletonCell} /></td>
                  <td><div className={styles.skeletonCell} /></td>
                  <td><div className={styles.skeletonCell} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Compare factories</h1>
        <p className={styles.error}>{error}</p>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => {
            setError(null);
            setLoading(true);
            setRetryTrigger((t) => t + 1);
          }}
        >
          Try again
        </button>
        <p className={styles.backWrap}>
          <Link href="/entrepreneurs">← Back to factories</Link>
        </p>
      </div>
    );
  }

  if (factories.length === 0) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>Compare factories</h1>
        <p className={styles.needMore}>No factory data to show.</p>
        <p className={styles.backWrap}>
          <Link href="/entrepreneurs">← Back to factories</Link>
        </p>
      </div>
    );
  }

  const labelsEn = factories[0].questionsEn || {};

  /** Score cell for "best in row": higher = more complete. */
  function cellScore(raw: string | undefined): number {
    if (raw == null || String(raw).trim() === "") return 0;
    const s = String(raw).trim();
    if (s === "yes" || s === "no") return 1;
    if (s.startsWith("uploads/")) return 2;
    try {
      const arr = JSON.parse(s) as unknown[];
      if (Array.isArray(arr) && arr.length > 0) return 2;
    } catch {
      // text
    }
    return 1 + Math.min(1, s.length / 200);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Compare factories</h1>
        <div className={styles.headerActions}>
          {factories.length > 0 && (
            <button
              type="button"
              className={styles.addAllShortlistBtn}
              onClick={handleAddAllToShortlist}
              disabled={allInShortlist}
              title={allInShortlist ? "All in shortlist" : "Add all to shortlist"}
            >
              {allInShortlist ? "All in shortlist" : `Add all ${factories.length} to shortlist`}
            </button>
          )}
          <button
            type="button"
            className={styles.copyLinkBtn}
            onClick={handleCopyLink}
            title="Copy link to this comparison"
          >
            {shareCopied ? "Link copied!" : "Copy link"}
          </button>
          <Link href="/entrepreneurs" className={styles.backLink}>
            ← Back to factories
          </Link>
        </div>
      </div>

      <p className={styles.compareTip}>
        To see private answers in the table, open each factory’s page and use &quot;Request access to private answers&quot;.
      </p>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thQuestion}>Question</th>
              {factories.map((f) => {
                const inShortlist = shortlistIds.includes(f.id);
                return (
                  <th key={f.id} className={styles.thFactory}>
                    <div className={styles.thFactoryName}>{f.name}</div>
                    {f.address && (
                      <div className={styles.thFactoryAddress}>{f.address}</div>
                    )}
                    <div className={styles.thFactoryActions}>
                      <button
                        type="button"
                        className={styles.addShortlistBtn}
                        onClick={() => {
                          addToShortlist(f.id);
                          setShortlistIds(getShortlistIds());
                        }}
                        disabled={inShortlist}
                        title={inShortlist ? "In shortlist" : "Add to shortlist"}
                      >
                        {inShortlist ? "★ In shortlist" : "☆ Add to shortlist"}
                      </button>
                      <Link href={`/entrepreneurs/factory/${f.id}`} className={styles.thFactoryLink}>
                        View full profile →
                      </Link>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {questionRows.map((row) => {
              if (!row.id) {
                return (
                  <tr key={row.sectionEn}>
                    <td colSpan={factories.length + 1} className={styles.sectionRow}>
                      {row.sectionEn}
                    </td>
                  </tr>
                );
              }
              const label = labelsEn[row.id] ?? row.questionEn;
              const scores = factories.map((f) => {
                const raw = f.answers[row.id];
                if (f.privateQuestionIds?.includes(row.id)) return 0;
                return cellScore(raw);
              });
              const maxScore = Math.max(...scores, 0);
              const bestIndex = maxScore > 0 ? scores.indexOf(maxScore) : -1;
              return (
                <tr key={row.id}>
                  <td className={styles.tdQuestion}>{label}</td>
                  {factories.map((f, colIndex) => {
                    const raw = f.answers[row.id];
                    const isPrivate = f.privateQuestionIds?.includes(row.id);
                    const isBest = bestIndex >= 0 && colIndex === bestIndex;
                    return (
                      <td
                        key={f.id}
                        className={`${styles.tdCell} ${isBest ? styles.tdCellBest : ""}`}
                      >
                        {isPrivate ? (
                          <span className={styles.privateCell}>Not shared</span>
                        ) : raw != null && String(raw).trim() !== "" ? (
                          cellSummary(raw, f.id)
                        ) : (
                          <span className={styles.emptyCell}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareFallback() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Compare factories</h1>
      <p className={styles.loading}>Loading…</p>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <ComparePageContent />
    </Suspense>
  );
}
