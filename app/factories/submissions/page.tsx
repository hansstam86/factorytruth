"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Submission = {
  answers: Record<string, string>;
};

type Question = { id: string; section: string };

type FactoryStats = {
  myScore: number;
  myAnsweredCount: number;
  totalQuestions: number;
  totalFactories: number;
  rankPercentile: number;
  factoriesBeatCount: number;
  platformAverageScore: number;
  nextMilestone: { targetPct: number; questionsNeeded: number } | null;
  badge: string;
  hasSubmission: boolean;
};

function sectionProgress(questions: Question[], answers: Record<string, string>) {
  const bySection = new Map<string, { total: number; answered: number }>();
  for (const q of questions) {
    const cur = bySection.get(q.section) ?? { total: 0, answered: 0 };
    cur.total += 1;
    const v = answers[q.id];
    if (v != null && String(v).trim() !== "") cur.answered += 1;
    bySection.set(q.section, cur);
  }
  return Array.from(bySection.entries()).map(([section, { total, answered }]) => ({
    section,
    answered,
    total,
  }));
}

export default function SubmissionsPage() {
  const [success, setSuccess] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSuccess(params.get("success") === "1");
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/my-submission", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/questions", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/factory-stats", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([subData, qList, statsData]) => {
        setSubmission(subData.submission ?? null);
        setQuestions(Array.isArray(qList) ? qList : []);
        setStats(statsData ?? null);
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
  const sections = sectionProgress(questions, answers);

  return (
    <div className={styles.submissionsWrap}>
      <h1 className={styles.pageTitle}>我的提交</h1>
      {success && (
        <div className={styles.successBanner}>
          您的审核答案已成功提交。欧洲的创业者将能够看到您的工厂信息并联系您。
        </div>
      )}
      {!loading && submission && totalQuestions > 0 && (
        <>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreHead}>
              <p className={styles.scoreTitle}>
                您的透明度得分：<strong>{transparencyPct}%</strong>
              </p>
              {stats?.badge && (
                <span className={styles.badge} data-level={stats.myScore >= 75 ? "high" : stats.myScore >= 50 ? "mid" : "low"}>
                  {stats.badge}
                </span>
              )}
            </div>
            <p className={styles.scoreDesc}>
              已填写 {answeredCount} / {totalQuestions} 项。答得越多，海外客户越容易信任您。点击下方按钮补充或修改答案，提高得分以吸引更多优质客户。
            </p>
            {stats && stats.totalFactories > 0 && (
              <div className={styles.rankRow}>
                <span>您超过了平台 <strong>{stats.rankPercentile}%</strong> 的工厂</span>
                <span className={styles.rankDivider}>·</span>
                <span>平台平均完成度 <strong>{stats.platformAverageScore}%</strong></span>
              </div>
            )}
            {stats?.nextMilestone && stats.nextMilestone.questionsNeeded > 0 && (
              <p className={styles.nextMilestone}>
                再答 <strong>{stats.nextMilestone.questionsNeeded}</strong> 题即可达到{" "}
                <strong>{stats.nextMilestone.targetPct}%</strong>，获得更高曝光。
              </p>
            )}
          </div>
          {sections.length > 0 && (
            <div className={styles.sectionProgressBlock}>
              <h2 className={styles.sectionProgressTitle}>各板块完成情况</h2>
              <ul className={styles.sectionProgressList}>
                {sections.map(({ section, answered, total }) => (
                  <li key={section} className={styles.sectionProgressItem}>
                    <span className={styles.sectionName}>{section}</span>
                    <span className={styles.sectionCount}>
                      {answered}/{total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <p className={`${styles.pageDesc} zh`}>
        您提交的审核答案会在「创业者」端展示，帮助海外客户了解并信任您的工厂。信息越完整，越容易获得优质客户。如需修改或补充，请重新提交审核答案。
      </p>
      <div className={styles.whyTransparencyBlock}>
        <h3 className={styles.whyTransparencyTitle}>为什么透明度重要？</h3>
        <p className={styles.whyTransparencyDesc}>
          平台按同一套流程（从收货、来料检验、仓储到生产、包装、发货）比较所有工厂。您填写的环节越多、越清晰，海外创业者在筛选时越容易看到您、信任您。
          <Link href="/flow" className={styles.whyTransparencyLink} target="_blank" rel="noopener noreferrer">
            了解审核流程与各环节 →
          </Link>
        </p>
      </div>
      <Link href="/factories" className={`${styles.btn} ${styles.btnPrimary}`}>
        再次提交审核答案
      </Link>
    </div>
  );
}
