"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Factory = {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
};

export default function EntrepreneursPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/factories")
      .then((res) => res.json())
      .then((data) => {
        setFactories(Array.isArray(data) ? data : []);
      })
      .catch(() => setFactories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>Browse factories</h1>
      <p className={styles.pageDesc}>
        View audit answers submitted by factories in China. Click a factory to see full details and select your manufacturing partner.
      </p>

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
          {factories.map((f) => (
            <li key={f.id} className={styles.factoryCard}>
              <Link href={`/entrepreneurs/factory/${f.id}`} className={styles.cardLink}>
                <div className={styles.cardName}>{f.name}</div>
                {f.address && (
                  <div className={styles.cardMeta}>Address: {f.address}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
