"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { AUDIT_QUESTIONS, FILE_ACCEPT } from "@/lib/audit-questions";

export default function FactoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, "public" | "private">>({});
  const [sending, setSending] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [questions, setQuestions] = useState<typeof AUDIT_QUESTIONS>(AUDIT_QUESTIONS);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/questions", { credentials: "include" }).then((res) => (res.ok ? res.json() : [])),
    ]).then(([authData, questionsList]) => {
      setUser(authData.user);
      if (Array.isArray(questionsList) && questionsList.length > 0) {
        setQuestions(questionsList);
      }
      if (!authData.user) {
        setAuthLoading(false);
        return;
      }
      return fetch("/api/my-submission", { credentials: "include" });
    })
      .then((res) => {
        if (!res || !res.ok) {
          setAuthLoading(false);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.submission) {
          if (data.submission.answers) {
            setAnswers(data.submission.answers);
          }
          if (data.submission.visibility) {
            setVisibility(data.submission.visibility);
          }
          setHasExisting(!!data.submission.answers);
        }
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleVisibilityChange = (id: string, privateAnswer: boolean) => {
    setVisibility((prev) => ({
      ...prev,
      [id]: privateAnswer ? "private" : "public",
    }));
  };

  const REQUIRED_BASIC_IDS = ["q1", "q2"];
  const BASIC_LABELS: Record<string, string> = { q1: "工厂名称", q2: "工厂地址" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    for (const id of REQUIRED_BASIC_IDS) {
      if (!answers[id]?.trim()) {
        const label = BASIC_LABELS[id] || id;
        alert(`请填写必填项：${label}`);
        return;
      }
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("answers", JSON.stringify(answers));
      formData.append("visibility", JSON.stringify(visibility));

      for (const q of questions) {
        if (q.type !== "file" && q.type !== "files") continue;
        const input = fileInputRefs.current[q.id];
        if (!input?.files?.length) continue;
        for (let i = 0; i < input.files.length; i++) {
          formData.append(`file_${q.id}`, input.files[i]);
        }
      }

      const res = await fetch("/api/submit-audit", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setHasExisting(true);
        router.push("/factories/submissions?success=1");
        router.refresh();
      } else {
        alert(data.error || "提交失败，请稍后重试。");
      }
    } catch {
      alert("网络错误，请检查连接后重试。");
    } finally {
      setSending(false);
    }
  };

  let currentSection = "";
  const questionsWithSections = questions.map((q) => {
    const showSection = q.section !== currentSection;
    if (showSection) currentSection = q.section;
    return { ...q, showSection };
  });

  if (authLoading) {
    return (
      <div className={styles.formWrap}>
        <p className={styles.loading}>加载中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.formWrap}>
        <h1 className={styles.pageTitle}>提交审核答案</h1>
        <div className={styles.valueBlock}>
          <p className={styles.valueTitle}>找到更多优质客户</p>
          <p className={styles.valueDesc}>
            本平台帮助中国工厂对接海外硬件创业者。您分享的审核信息越完整、越透明，潜在客户就越信任您，越有可能将生产项目交给您。请如实填写审核答案，让更多创业者发现并选择您的工厂。
          </p>
        </div>
        <div className={styles.loginPrompt}>
          <p>请先登录后再提交或编辑审核答案。请使用工厂的公司邮箱注册（不能使用 Gmail、QQ 等个人邮箱）。</p>
          <div className={styles.loginActions}>
            <Link href="/factories/login" className={styles.btnPrimary}>
              登录
            </Link>
            <Link href="/factories/register" className={styles.btnSecondary}>
              注册
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <h1 className={styles.pageTitle}>
        {hasExisting ? "编辑审核答案" : "提交审核答案"}
      </h1>
      <div className={styles.valueBlock}>
        <p className={styles.valueTitle}>信息越透明，客户越信任</p>
        <p className={styles.valueDesc}>
          海外创业者通过本平台寻找可信赖的工厂。您填写的审核答案越完整，越容易获得他们的信任与订单。可将部分答案设为「不公开」，仅经您批准的创业者可见。
        </p>
      </div>
      <p className={styles.pageDesc}>
        {hasExisting
          ? "修改以下内容后点击「更新答案」保存。"
          : "请如实填写以下问题。"}
      </p>

      <form onSubmit={handleSubmit} className={styles.auditForm}>
        {questionsWithSections.map((q) => (
          <div key={q.id}>
            {q.showSection && (
              <h2 className={styles.sectionTitle}>{q.section}</h2>
            )}
            <div className={styles.field}>
              <label htmlFor={q.id}>
                {q.questionZh}
                {(q.id === "q1" || q.id === "q2") && <span className={styles.required}> （必填）</span>}
              </label>
              {q.type === "textarea" ? (
                <textarea
                  id={q.id}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  rows={3}
                  placeholder="请填写"
                />
              ) : q.type === "yesno" ? (
                <select
                  id={q.id}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                >
                  <option value="">请选择</option>
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              ) : q.type === "file" || q.type === "files" ? (
                <div className={styles.fileWrap}>
                  <input
                    ref={(el) => { fileInputRefs.current[q.id] = el; }}
                    type="file"
                    id={q.id}
                    accept={FILE_ACCEPT}
                    multiple={q.type === "files"}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileHint}>
                    {q.type === "files" ? "可上传多份（PDF、PPT、Excel、图片）" : "PDF、PPT、Excel、图片"}
                  </span>
                  {answers[q.id] && (
                    <span className={styles.fileCurrent}>
                      已上传：{typeof answers[q.id] === "string" && !answers[q.id].startsWith("[")
                        ? "1 个文件"
                        : "多份文件"}
                    </span>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  id={q.id}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="请填写"
                  required={q.id === "q1" || q.id === "q2"}
                />
              )}
              <label className={styles.privateLabel}>
                <input
                  type="checkbox"
                  checked={visibility[q.id] === "private"}
                  onChange={(e) => handleVisibilityChange(q.id, e.target.checked)}
                />
                不公开（仅经我批准的创业者可见）
              </label>
            </div>
          </div>
        ))}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={sending}
          >
            {sending
              ? "保存中…"
              : hasExisting
              ? "更新答案"
              : "提交审核答案"}
          </button>
        </div>
      </form>
    </div>
  );
}
