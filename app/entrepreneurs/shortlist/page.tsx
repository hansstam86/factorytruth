"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";
import { getShortlistIds, removeFromShortlist } from "@/lib/shortlist";

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
};

export default function ShortlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIds(getShortlistIds());
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setFactories([]);
      setLoading(false);
      return;
    }
    const param = ids.join(",");
    fetch(`/api/factories?ids=${encodeURIComponent(param)}`)
      .then((res) => res.json())
      .then((data) => setFactories(Array.isArray(data) ? data : []))
      .catch(() => setFactories([]))
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  const handleRemove = (id: string) => {
    removeFromShortlist(id);
    setIds(getShortlistIds());
    setFactories((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>My shortlist</h1>
      <p className={styles.pageDesc}>
        Factories you’ve saved. Click a factory to see full details, or remove it from your shortlist.
      </p>

      {loading ? (
        <p className={styles.loading}>Loading shortlist…</p>
      ) : ids.length === 0 ? (
        <div className={styles.empty}>
          <p>Your shortlist is empty.</p>
          <p className={styles.emptyHint}>
            When you browse factories, click <strong>Save</strong> on any card to add it here.
          </p>
          <p className={styles.emptyHint}>
            <Link href="/entrepreneurs">Browse factories</Link>
          </p>
        </div>
      ) : factories.length === 0 ? (
        <div className={styles.empty}>
          <p>No factories found for your shortlist.</p>
          <p className={styles.emptyHint}>
            Some saved factories may have been removed. <Link href="/entrepreneurs">Browse factories</Link> to add more.
          </p>
        </div>
      ) : (
        <ul className={styles.factoryList}>
          {factories.map((f) => (
            <li key={f.id} className={styles.factoryCard}>
              <div className={styles.cardRow}>
                <button
                  type="button"
                  className={styles.shortlistBtn}
                  title="Remove from shortlist"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(f.id);
                  }}
                  aria-pressed="true"
                >
                  <span className={styles.shortlistIcon} aria-hidden>★</span>
                  <span className={styles.shortlistLabelText}>Saved</span>
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
          ))}
        </ul>
      )}

      <p className={styles.back}>
        <Link href="/entrepreneurs">← Browse factories</Link>
      </p>
    </div>
  );
}
