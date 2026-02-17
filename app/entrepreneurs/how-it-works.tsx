"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./how-it-works.module.css";

const STORAGE_KEY = "factorytruth_onboarding_seen";

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner} role="region" aria-label="How it works">
      <div className={styles.bannerInner}>
        <h2 className={styles.bannerTitle}>How it works</h2>
        <ol className={styles.steps}>
          <li><strong>Browse</strong> — View factories and their audit answers.</li>
          <li><strong>Shortlist & compare</strong> — Save factories and compare them side by side.</li>
          <li><strong>Contact</strong> — Request access to private answers or ask questions directly.</li>
        </ol>
        <div className={styles.bannerActions}>
          <button type="button" className={styles.dismissBtn} onClick={dismiss}>
            Got it
          </button>
          <Link href="/entrepreneurs/compare" className={styles.compareLink}>
            Compare factories
          </Link>
        </div>
      </div>
    </div>
  );
}
