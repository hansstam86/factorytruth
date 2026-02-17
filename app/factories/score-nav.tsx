"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

export default function ScoreNav() {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/factory-stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.hasSubmission && typeof data.myScore === "number") {
          setScore(data.myScore);
        }
      })
      .catch(() => {});
  }, []);

  if (score === null) return null;

  return (
    <Link href="/factories/submissions" className={styles.scoreNavLink}>
      透明度 {score}%
    </Link>
  );
}
