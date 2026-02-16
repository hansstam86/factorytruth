"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getCompareIds, setCompareIds, toggleCompare, COMPARE_MAX } from "@/lib/compare-factories";

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
};

export default function EntrepreneursPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIdsState] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/factories")
      .then((res) => res.json())
      .then((data) => {
        setFactories(Array.isArray(data) ? data : []);
      })
      .catch(() => setFactories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCompareIdsState(getCompareIds());
    const onStorage = () => setCompareIdsState(getCompareIds());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleToggleCompare = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = getCompareIds();
    const inList = next.includes(id);
    if (inList) {
      const updated = next.filter((x) => x !== id);
      setCompareIds(updated);
      setCompareIdsState(updated);
    } else if (next.length < COMPARE_MAX) {
      const updated = [...next, id];
      setCompareIds(updated);
      setCompareIdsState(updated);
    }
  };

  const compareUrl = compareIds.length >= 2
    ? `/entrepreneurs/compare?ids=${compareIds.join(",")}`
    : "/entrepreneurs/compare";

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>Browse factories</h1>
      <p className={styles.pageDesc}>
        View audit answers submitted by factories in China. Click a factory to see full details, or select several to compare answers side by side.
      </p>

      {compareIds.length >= 2 && (
        <div className={styles.compareBar}>
          <span className={styles.compareCount}>
            {compareIds.length} factory {compareIds.length === 1 ? "selected" : "factories selected"} (max {COMPARE_MAX})
          </span>
          <Link href={compareUrl} className={styles.compareLink}>
            Compare side by side →
          </Link>
          <button
            type="button"
            className={styles.compareClear}
            onClick={() => {
              setCompareIds([]);
              setCompareIdsState([]);
            }}
          >
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.loading}>Loading factories…</p>
      ) : factories.length === 0 ? (
        <div className={styles.empty}>
          <p>No factory submissions yet.</p>
          <p className={styles.emptyHint}>
            When factories submit their audit answers via the factory portal, they will appear here.
          </p>
        </div>
      ) : (
        <ul className={styles.factoryList}>
          {factories.map((f) => {
            const selected = compareIds.includes(f.id);
            const atMax = compareIds.length >= COMPARE_MAX && !selected;
            return (
              <li key={f.id} className={styles.factoryCard}>
                <div className={styles.cardRow}>
                  <button
                    type="button"
                    className={styles.compareBtn}
                    disabled={atMax}
                    title={atMax ? `Maximum ${COMPARE_MAX} factories` : selected ? "Remove from comparison" : "Add to comparison"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleCompare(e, f.id);
                    }}
                    aria-pressed={selected}
                  >
                    <span className={styles.compareCheckbox} aria-hidden>
                      {selected ? "☑" : "☐"}
                    </span>
                    <span className={styles.compareLabelText}>Compare</span>
                  </button>
                  <Link href={`/entrepreneurs/factory/${f.id}`} className={styles.cardLink}>
                    <div className={styles.cardName}>{f.name}</div>
                    {f.address && (
                      <div className={styles.cardMeta}>Address: {f.address}</div>
                    )}
                    {f.expertise && (
                      <div className={styles.cardMeta}>Expertise: {f.expertise}</div>
                    )}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
