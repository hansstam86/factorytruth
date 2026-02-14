"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./auth-bar.module.css";

export default function AdminAuthBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin-auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/admin/login";
  };

  if (loading) return <span className={styles.muted}>…</span>;
  if (!user) {
    if (pathname === "/admin/login") return null;
    return (
      <Link href="/admin/login" className={styles.link}>
        Log in
      </Link>
    );
  }
  return (
    <span className={styles.user}>
      <span className={styles.email}>{user.email}</span>
      <button type="button" onClick={handleLogout} className={styles.logout}>
        Log out
      </button>
    </span>
  );
}
