"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./auth-bar.module.css";

type User = { email: string; name?: string } | null;

export default function EntrepreneurAuthBar() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/entrepreneur-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/entrepreneur-auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    window.location.href = "/entrepreneurs";
  };

  if (loading) {
    return <span className={styles.placeholder}>...</span>;
  }

  if (user) {
    return (
      <div className={styles.userWrap}>
        <span className={styles.userEmail}>
          {user.name ? `${user.name}` : user.email}
        </span>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.guestWrap}>
      <Link href="/entrepreneurs/login" className={styles.authLink}>
        Log in
      </Link>
      <span className={styles.sep}>|</span>
      <Link href="/entrepreneurs/register" className={styles.authLink}>
        Sign up
      </Link>
    </div>
  );
}
