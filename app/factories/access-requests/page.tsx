"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getQuestionLabelsZh } from "@/lib/audit-questions";

const LABELS_ZH = getQuestionLabelsZh();

type AccessRequest = {
  id: string;
  submissionId: string;
  entrepreneurEmail: string;
  entrepreneurName?: string;
  questionIds: string[];
  status: "pending" | "approved" | "denied";
  createdAt: string;
  respondedAt?: string;
};

type AccessGrant = {
  entrepreneurEmail: string;
  questionIds: string[];
};

function formatQuestionList(questionIds: string[]): string[] {
  return questionIds.map((qId) => LABELS_ZH[qId] || qId);
}

export default function AccessRequestsPage() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchGrants = (id: string) => {
    return fetch(`/api/access-grants?submissionId=${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setGrants(Array.isArray(list) ? list : []))
      .catch(() => setGrants([]));
  };

  useEffect(() => {
    setError(null);
    fetch("/api/my-submission", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { submission: null })
      .then((data) => {
        const id = data?.submission?.id ?? null;
        setSubmissionId(id);
        if (!id) {
          setLoading(false);
          return;
        }
        return Promise.all([
          fetch(`/api/access-requests?submissionId=${encodeURIComponent(id)}`, { credentials: "include" }),
          fetchGrants(id),
        ]).then(([reqRes]) => reqRes as Response);
      })
      .then((res) => {
        if (!res) return [];
        if (!res.ok) {
          if (res.status === 401) setError("请先登录工厂账号。");
          else if (res.status === 403) setError("无法加载访问请求。");
          return [];
        }
        return res.json();
      })
      .then((list) => setRequests(Array.isArray(list) ? list : []))
      .catch(() => {
        setRequests([]);
        setError("加载失败，请稍后重试。");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (entrepreneurEmail: string) => {
    if (!submissionId) return;
    setRevoking(entrepreneurEmail);
    try {
      const res = await fetch(
        `/api/access-grants?submissionId=${encodeURIComponent(submissionId)}&entrepreneurEmail=${encodeURIComponent(entrepreneurEmail)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.revoked) {
          setGrants((prev) => prev.filter((g) => g.entrepreneurEmail !== entrepreneurEmail));
        }
      }
    } finally {
      setRevoking(null);
    }
  };

  const handleRespond = async (requestId: string, status: "approved" | "denied") => {
    const res = await fetch(`/api/access-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status, respondedAt: new Date().toISOString() } : r
        )
      );
    }
  };

  if (loading) {
    return <p className={styles.loading}>加载中…</p>;
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>{error}</p>
        <Link href="/factories">返回提交审核</Link>
      </div>
    );
  }

  if (!submissionId) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>访问请求</h1>
        <p className={styles.desc}>
          请先提交审核答案后，创业者对您设为「不公开」的答案发送的访问请求会显示在这里。
        </p>
        <Link href="/factories" className={styles.link}>去提交审核</Link>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const responded = requests.filter((r) => r.status !== "pending");

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>访问请求</h1>
      <p className={styles.desc}>
        当创业者请求查看您设为「不公开」的答案时，会显示在下方。您可以查看是谁请求的、请求查看哪些答案，并选择同意或拒绝。已同意过的访问可在「已授予的访问」中撤销。
      </p>

      {grants.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>已授予的访问（{grants.length}）</h2>
          <ul className={styles.list}>
            {grants.map((g) => (
              <li key={g.entrepreneurEmail} className={styles.card}>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>创业者</h3>
                  <p className={styles.cardEmail}>{g.entrepreneurEmail}</p>
                </div>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>可查看的答案</h3>
                  <ul className={styles.questionList}>
                    {formatQuestionList(g.questionIds).map((label, i) => (
                      <li key={i}>{label}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.denyBtn}
                    onClick={() => handleRevoke(g.entrepreneurEmail)}
                    disabled={revoking === g.entrepreneurEmail}
                  >
                    {revoking === g.entrepreneurEmail ? "撤销中…" : "撤销访问"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pending.length === 0 && responded.length === 0 && grants.length === 0 && (
        <p className={styles.empty}>暂无访问请求。创业者在对您工厂的页面点击「Request access to private answers」后，请求会出现在这里。</p>
      )}

      {pending.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>待处理（{pending.length}）</h2>
          <ul className={styles.list}>
            {pending.map((r) => (
              <li key={r.id} className={styles.card}>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>请求人</h3>
                  <p className={styles.cardName}>{r.entrepreneurName || "—"}</p>
                  <p className={styles.cardEmail}>{r.entrepreneurEmail}</p>
                  <p className={styles.cardDate}>请求时间：{new Date(r.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>请求查看以下答案</h3>
                  <ul className={styles.questionList}>
                    {formatQuestionList(r.questionIds).map((label, i) => (
                      <li key={i}>{label}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => handleRespond(r.id, "approved")}
                  >
                    同意
                  </button>
                  <button
                    type="button"
                    className={styles.denyBtn}
                    onClick={() => handleRespond(r.id, "denied")}
                  >
                    拒绝
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {responded.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>已处理（{responded.length}）</h2>
          <ul className={styles.list}>
            {responded.map((r) => (
              <li key={r.id} className={styles.card}>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>请求人</h3>
                  <p className={styles.cardName}>{r.entrepreneurName || "—"}</p>
                  <p className={styles.cardEmail}>{r.entrepreneurEmail}</p>
                  <span className={r.status === "approved" ? styles.badgeApproved : styles.badgeDenied}>
                    {r.status === "approved" ? "已同意" : "已拒绝"}
                  </span>
                  {r.respondedAt && (
                    <p className={styles.cardDate}>处理时间：{new Date(r.respondedAt).toLocaleString("zh-CN")}</p>
                  )}
                </div>
                <div className={styles.cardSection}>
                  <h3 className={styles.cardLabel}>当时请求查看的答案</h3>
                  <ul className={styles.questionList}>
                    {formatQuestionList(r.questionIds).map((label, i) => (
                      <li key={i}>{label}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.back}>
        <Link href="/factories">返回提交审核</Link>
      </p>
    </div>
  );
}
