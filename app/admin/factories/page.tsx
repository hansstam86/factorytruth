"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type Factory = {
  id: string;
  userId?: string;
  name: string;
  address: string;
  createdAt: string;
};

export default function AdminFactoriesPage() {
  const router = useRouter();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFactories = () => {
    return fetch("/api/admin/factories", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setFactories(Array.isArray(list) ? list : []))
      .catch(() => setFactories([]));
  };

  useEffect(() => {
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/admin/login");
          return;
        }
        return fetchFactories();
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
      const res = await fetch("/api/admin/factories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: createEmail, password: createPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create factory.");
        return;
      }
      setMessage(`Factory account created: ${createEmail}. They can log in and submit their audit.`);
      setCreateEmail("");
      setCreatePassword("");
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete factory "${name}"? This removes their submission, account, and all related data.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/factories/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setFactories((prev) => prev.filter((f) => f.id !== id));
        setMessage("Factory deleted.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Factories</h1>
      <p className={styles.desc}>
        Factories appear here after they have submitted an audit. You can create a factory account (they then log in and submit) or delete a factory (removes their submission and account).
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Create factory account</h2>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="factory@company.com"
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
          <button type="submit" className={styles.primaryBtn} disabled={creating}>
            {creating ? "Creating…" : "Create factory account"}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Factories with submissions ({factories.length})</h2>
        {factories.length === 0 ? (
          <p className={styles.empty}>No factories yet. Create an account above or wait for one to register and submit.</p>
        ) : (
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Login (email)</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {factories.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.address}</td>
                  <td>{f.userId || "—"}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => handleDelete(f.id, f.name)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <p className={styles.back}>
        <Link href="/admin">← Dashboard</Link>
      </p>
    </div>
  );
}
