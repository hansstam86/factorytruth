"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";
import { getShortlistIds, removeFromShortlist } from "@/lib/shortlist";
import { setCompareIds } from "@/lib/compare-factories";

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
  transparencyScore?: number;
};

export default function ShortlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

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

  const handleShareShortlist = () => {
    if (typeof window === "undefined" || ids.length < 2) return;
    const url = `${window.location.origin}/entrepreneurs/compare?ids=${ids.slice(0, 6).join(",")}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>My shortlist</h1>
      <p className={styles.pageDesc}>
        Factories you’ve saved. Click a factory to see full details, or remove it from your shortlist.
      </p>
      {ids.length >= 2 && (
        <div className={styles.shortlistCompareCta}>
          <Link
            href={`/entrepreneurs/compare?ids=${ids.slice(0, 6).join(",")}`}
            className={styles.shortlistCompareBtn}
            onClick={() => setCompareIds(ids.slice(0, 6))}
          >
            Compare these {ids.length} factories →
          </Link>
          <button
            type="button"
            className={styles.shareShortlistBtn}
            onClick={handleShareShortlist}
            title="Copy link to compare these factories"
          >
            {shareCopied ? "Link copied!" : "Share shortlist"}
          </button>
        </div>
      )}

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
                <div className={styles.shortlistCardActions}>
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
                  <button
                    type="button"
                    className={styles.removeFromShortlistLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(f.id);
                    }}
                  >
                    Remove from shortlist
                  </button>
                </div>
                <Link href={`/entrepreneurs/factory/${f.id}`} className={styles.cardLink}>
                  <div className={styles.cardHead}>
                    <span className={styles.cardName}>{f.name}</span>
                    {typeof f.transparencyScore === "number" && (
                      <span className={styles.transparencyBadge} title="Transparency score">
                        {f.transparencyScore}%
                      </span>
                    )}
                  </div>
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
