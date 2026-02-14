"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type Entrepreneur = {
  email: string;
  name?: string;
  provider?: string;
  createdAt?: string;
};

export default function AdminEntrepreneursPage() {
  const router = useRouter();
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const fetchEntrepreneurs = () => {
    return fetch("/api/admin/entrepreneurs", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setEntrepreneurs(Array.isArray(list) ? list : []))
      .catch(() => setEntrepreneurs([]));
  };

  useEffect(() => {
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/admin/login");
          return;
        }
        return fetchEntrepreneurs();
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/entrepreneurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          name: createName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create entrepreneur.");
        return;
      }
      setMessage(`Entrepreneur created: ${createEmail}. They can log in now.`);
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      fetchEntrepreneurs();
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete entrepreneur ${email}? They will no longer be able to log in.`)) return;
    setDeletingEmail(email);
    setError(null);
    try {
      const res = await fetch("/api/admin/entrepreneurs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEntrepreneurs((prev) => prev.filter((e) => e.email !== email));
        setMessage("Entrepreneur deleted.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeletingEmail(null);
    }
  };

  if (loading) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Entrepreneurs</h1>
      <p className={styles.desc}>
        Create entrepreneur accounts or delete existing ones. Deleted users can no longer log in.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Create entrepreneur account</h2>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="user@company.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Name (optional)</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Display name"
            />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={creating}>
            {creating ? "Creating…" : "Create entrepreneur"}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Existing entrepreneurs ({entrepreneurs.length})</h2>
        {entrepreneurs.length === 0 ? (
          <p className={styles.empty}>No entrepreneurs yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Provider</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entrepreneurs.map((e) => (
                <tr key={e.email}>
                  <td>{e.email}</td>
                  <td>{e.name || "—"}</td>
                  <td>{e.provider || "—"}</td>
                  <td>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => handleDelete(e.email)}
                      disabled={deletingEmail === e.email}
                    >
                      {deletingEmail === e.email ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className={styles.back}>
        <Link href="/admin">← Dashboard</Link>
      </p>
    </div>
  );
}
