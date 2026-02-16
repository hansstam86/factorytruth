"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function SubmissionsPage() {
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSuccess(params.get("success") === "1");
  }, []);

  return (
    <div className={styles.submissionsWrap}>
      <h1 className={styles.pageTitle}>我的提交</h1>
      {success && (
        <div className={styles.successBanner}>
          您的审核答案已成功提交。欧洲的创业者将能够看到您的工厂信息并联系您。
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
