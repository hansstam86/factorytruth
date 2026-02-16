"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Submission = {
  id: string;
  userId?: string;
  answers: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
};

export default function AdminEditFactoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [expertise, setExpertise] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((auth) => {
        if (!auth?.user) {
          router.replace("/admin/login");
          return Promise.reject(new Error("Unauthorized"));
        }
        return fetch(`/api/admin/factories/${encodeURIComponent(id)}`, { credentials: "include" });
      })
      .then((res) => (res?.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSubmission(data);
          setName(data.answers?.q1 ?? "");
          setAddress(data.answers?.q2 ?? "");
          setExpertise(data.answers?.q3 ?? "");
        }
      })
      .catch(() => setSubmission(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/factories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers: {
            q1: name.trim(),
            q2: address.trim(),
            q3: expertise.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      setMessage("Factory information saved.");
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              answers: { ...prev.answers, q1: name.trim(), q2: address.trim(), q3: expertise.trim() },
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading…</p>;

  if (!submission) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>Factory not found.</p>
        <p className={styles.back}>
          <Link href="/admin/factories">← Back to factories</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Edit factory</h1>
      <p className={styles.desc}>
        Update the factory’s basic information. Changes appear on the entrepreneur portal.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.message}>{message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="q1">Company name (q1)</label>
          <input
            id="q1"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="q2">Address (q2)</label>
          <input
            id="q2"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="q3">Expertise / Main business (q3)</label>
          <textarea
            id="q3"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            rows={4}
            className={styles.textarea}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link href="/admin/factories" className={styles.cancelLink}>
            Cancel
          </Link>
        </div>
      </form>

      <p className={styles.meta}>
        Created {new Date(submission.createdAt).toLocaleString()}
        {submission.updatedAt && ` · Updated ${new Date(submission.updatedAt).toLocaleString()}`}
      </p>

      <p className={styles.back}>
        <Link href="/admin/factories">← Back to factories</Link>
      </p>
    </div>
  );
}
