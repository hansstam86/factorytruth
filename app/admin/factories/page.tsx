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
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  /** Strip BOM and normalize line endings for CSV. */
  const normalizeCSVText = (text: string): string => {
    let t = text.trim();
    if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
    return t;
  };

  /** Parse CSV with quoted fields (handles newlines and commas inside quotes). Returns array of [company, address?, expertise?]. */
  const parseCSV = (text: string): string[][] => {
    text = normalizeCSVText(text);
    const rows: string[][] = [];
    let i = 0;
    const len = text.length;
    while (i < len) {
      const row: string[] = [];
      while (i < len) {
        if (text[i] === '"') {
          i++;
          let cell = "";
          while (i < len) {
            if (text[i] === '"') {
              if (text[i + 1] === '"') {
                cell += '"';
                i += 2;
              } else {
                i++;
                break;
              }
            } else {
              cell += text[i];
              i++;
            }
          }
          row.push(cell.trim());
          if (i < len && text[i] === ",") i++;
          else if (i < len && (text[i] === "\n" || text[i] === "\r")) {
            i++;
            if (i < len && text[i] === "\n") i++;
            break;
          } else break;
        } else {
          let cell = "";
          while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
            cell += text[i];
            i++;
          }
          row.push(cell.trim());
          if (i < len && text[i] === ",") i++;
          else if (i < len && (text[i] === "\n" || text[i] === "\r")) {
            i++;
            if (i < len && text[i] === "\n") i++;
            break;
          } else break;
        }
      }
      while (row.length < 3) row.push("");
      if (row.some((c) => c.length > 0)) rows.push(row);
    }
    return rows;
  };

  /** From parsed CSV rows (first row may be header), build { name, address, expertise }[]. */
  const csvRowsToBulkRows = (parsed: string[][]): { name: string; address: string; expertise: string }[] => {
    if (parsed.length === 0) return [];
    const first = parsed[0];
    const firstCell = (first[0] ?? "").trim().toLowerCase().replace(/^\ufeff/, "");
    const hasHeader =
      first.length >= 1 &&
      (firstCell === "company" || firstCell === "name") &&
      parsed.length > 1;
    const data = hasHeader ? parsed.slice(1) : parsed;
    return data
      .map((row) => ({
        name: (row[0] ?? "").trim(),
        address: (row[1] ?? "").trim(),
        expertise: (row[2] ?? "").trim(),
      }))
      .filter((r) => r.name.length > 0);
  };

  /** Parse paste area: "name" per line or "name, address, expertise" per line (simple split). */
  const parsePasteToBulkRows = (text: string): { name: string; address: string; expertise: string }[] => {
    return text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const parts = trimmed.split(",").map((p) => p.trim());
        return {
          name: parts[0] ?? "",
          address: parts[1] ?? "",
          expertise: parts[2] ?? "",
        };
      })
      .filter((r): r is { name: string; address: string; expertise: string } => r !== null && r.name.length > 0);
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

  const getBulkRows = (): { name: string; address: string; expertise: string }[] => {
    const text = normalizeCSVText(bulkNamesText);
    if (!text) return [];
    const firstLine = text.split(/\r?\n/)[0] ?? "";
    if (firstLine.includes('"') || firstLine.includes(",")) {
      const parsed = parseCSV(text);
      return csvRowsToBulkRows(parsed);
    }
    return parsePasteToBulkRows(text);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const rows = getBulkRows();
    if (rows.length === 0) {
      setError("Enter or upload at least one factory (Company, or Company, Address, Expertise).");
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
        body: JSON.stringify({ rows }),
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

  const handleBulkDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkDeleteConfirm !== "DELETE ALL") {
      setError('Type DELETE ALL (exactly) to confirm.');
      return;
    }
    setError(null);
    setMessage(null);
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/factories/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: "DELETE ALL" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bulk delete failed.");
        return;
      }
      setMessage("All factories and related data have been deleted.");
      setBulkDeleteConfirm("");
      fetchFactories();
    } catch {
      setError("Network error.");
    } finally {
      setBulkDeleting(false);
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
        <h2 className={styles.sectionTitle}>Bulk import factories</h2>
        <p className={styles.bulkHint}>
          Add many factories at once (name, address, expertise). Upload a CSV with columns <strong>Company, Address, Expertise</strong> (header row optional), or paste one row per line: <code>Company, Address, Expertise</code>. Max 50000 per import; duplicates by name are skipped.
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
            <label>CSV or paste (Company, Address, Expertise — one row per line)</label>
            <textarea
              value={bulkNamesText}
              onChange={(e) => setBulkNamesText(e.target.value)}
              placeholder={"Company, Address, Expertise\nAcme Inc, Shenzhen China, Electronics OEM"}
              rows={12}
              className={styles.bulkTextarea}
            />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={bulkImporting}>
            {bulkImporting ? "Importing…" : `Import ${getBulkRows().length} rows`}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Delete all factories</h2>
        <p className={styles.dangerHint}>
          Permanently remove every factory submission, access requests, grants, and uploads. Factory user accounts are kept. This cannot be undone.
        </p>
        <form onSubmit={handleBulkDelete} className={styles.bulkForm}>
          <div className={styles.field}>
            <label htmlFor="bulk-delete-confirm">
              Type <strong>DELETE ALL</strong> to confirm
            </label>
            <input
              id="bulk-delete-confirm"
              type="text"
              value={bulkDeleteConfirm}
              onChange={(e) => setBulkDeleteConfirm(e.target.value)}
              placeholder="DELETE ALL"
              className={styles.dangerInput}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className={styles.dangerBtnBig}
            disabled={bulkDeleting || bulkDeleteConfirm !== "DELETE ALL"}
          >
            {bulkDeleting ? "Deleting…" : "Delete all factories"}
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
                    <Link href={`/admin/factories/${encodeURIComponent(f.id)}`} className={styles.editLink}>
                      Edit
                    </Link>
                    {" · "}
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
