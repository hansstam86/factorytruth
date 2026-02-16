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
  const [bulkNamesText, setBulkNamesText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);

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

  const parseNamesFromText = (text: string): string[] => {
    return text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const firstComma = trimmed.indexOf(",");
        return firstComma >= 0 ? trimmed.slice(0, firstComma).trim() : trimmed;
      })
      .filter((n) => n.length > 0);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setBulkNamesText(text);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = parseNamesFromText(bulkNamesText);
    if (names.length === 0) {
      setError("Enter or upload at least one factory name.");
      return;
    }
    setError(null);
    setMessage(null);
    setBulkImporting(true);
    try {
      const res = await fetch("/api/admin/factories/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bulk import failed.");
        return;
      }
      setMessage(`Bulk import: ${data.added} added, ${data.skipped} skipped (duplicates). Total factories: ${data.total}.`);
      setBulkNamesText("");
      fetchFactories();
    } catch {
      setError("Network error.");
    } finally {
      setBulkImporting(false);
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
        <h2 className={styles.sectionTitle}>Bulk import factory names</h2>
        <p className={styles.bulkHint}>
          Add many factories at once so they appear in the entrepreneur list (name only, no login account). Export your Excel sheet as CSV, or paste one name per line. Max 2000 per import; duplicates are skipped.
        </p>
        <form onSubmit={handleBulkImport} className={styles.bulkForm}>
          <div className={styles.bulkRow}>
            <label className={styles.bulkFileLabel}>
              <span className={styles.bulkFileBtn}>Choose CSV or TXT file</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleBulkFileChange}
                className={styles.bulkFileInput}
              />
            </label>
          </div>
          <div className={styles.field}>
            <label>Factory names (one per line, or paste CSV — first column used)</label>
            <textarea
              value={bulkNamesText}
              onChange={(e) => setBulkNamesText(e.target.value)}
              placeholder={"Factory A\nFactory B\n..."}
              rows={12}
              className={styles.bulkTextarea}
            />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={bulkImporting}>
            {bulkImporting ? "Importing…" : `Import ${parseNamesFromText(bulkNamesText).length} names`}
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
