"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastViewed } from "@/lib/last-viewed";
import styles from "./layout.module.css";

export default function LastViewedLink() {
  const [last, setLast] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setLast(getLastViewed());
    const onStorage = () => setLast(getLastViewed());
    window.addEventListener("storage", onStorage);
    window.addEventListener("factorytruth-last-viewed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("factorytruth-last-viewed", onStorage);
    };
  }, []);

  if (!last?.id) return null;

  return (
    <Link href={`/entrepreneurs/factory/${last.id}`} className={styles.lastViewedLink}>
      Continue: {last.name}
    </Link>
  );
}
