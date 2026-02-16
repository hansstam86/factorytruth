"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Submission = {
  answers: Record<string, string>;
};

export default function SubmissionsPage() {
  const [success, setSuccess] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSuccess(params.get("success") === "1");
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/my-submission", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/questions", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([subData, qList]) => {
        setSubmission(subData.submission ?? null);
        setQuestions(Array.isArray(qList) ? qList : []);
      })
      .catch(() => setSubmission(null))
      .finally(() => setLoading(false));
  }, []);

  const totalQuestions = questions.length;
  const answers = submission?.answers ?? {};
  const answeredCount = totalQuestions
    ? questions.filter((q) => {
        const v = answers[q.id];
        return v != null && String(v).trim() !== "";
      }).length
    : 0;
  const transparencyPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className={styles.submissionsWrap}>
      <h1 className={styles.pageTitle}>我的提交</h1>
      {success && (
        <div className={styles.successBanner}>
          您的审核答案已成功提交。欧洲的创业者将能够看到您的工厂信息并联系您。
        </div>
      )}
      {!loading && submission && totalQuestions > 0 && (
        <div className={styles.scoreBlock}>
          <p className={styles.scoreTitle}>您的透明度得分：<strong>{transparencyPct}%</strong></p>
          <p className={styles.scoreDesc}>
            已填写 {answeredCount} / {totalQuestions} 项。答得越多，海外客户越容易信任您。点击下方按钮补充或修改答案，提高得分以吸引更多优质客户。
          </p>
        </div>
      )}
      <p className={`${styles.pageDesc} zh`}>
        您提交的审核答案会在「创业者」端展示，帮助海外客户了解并信任您的工厂。信息越完整，越容易获得优质客户。如需修改或补充，请重新提交审核答案。
      </p>
      <Link href="/factories" className={`${styles.btn} ${styles.btnPrimary}`}>
        再次提交审核答案
      </Link>
    </div>
  );
}
