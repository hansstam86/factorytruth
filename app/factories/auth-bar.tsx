"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./auth-bar.module.css";

type User = { email: string } | null;

export default function AuthBar() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/factories";
  };

  if (loading) {
    return <span className={styles.placeholder}>...</span>;
  }

  if (user) {
    return (
      <div className={styles.userWrap}>
        <span className={styles.userEmail}>欢迎，{user.email}</span>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          退出
        </button>
      </div>
    );
  }

  return (
    <div className={styles.guestWrap}>
      <Link href="/factories/login" className={styles.authLink}>
        登录
      </Link>
      <span className={styles.sep}>|</span>
      <Link href="/factories/register" className={styles.authLink}>
        注册
      </Link>
    </div>
  );
}
