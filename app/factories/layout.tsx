import Link from "next/link";
import AuthBar from "./auth-bar";
import ScoreNav from "./score-nav";
import styles from "./layout.module.css";

export default function FactoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.portalLayout} zh`} lang="zh-CN">
      <header className={styles.portalHeader}>
        <Link href="/" className={styles.logo}>
          Factory Truth
        </Link>
        <span className={styles.badge}>工厂入口</span>
        <div className={styles.navAndAuth}>
          <nav className={styles.nav}>
            <Link href="/factories">提交审核</Link>
            <Link href="/factories/submissions">我的提交</Link>
            <ScoreNav />
            <Link href="/factories/access-requests">访问请求</Link>
            <Link href="/factories/questions">创业者提问</Link>
            <Link href="/">返回首页</Link>
          </nav>
          <AuthBar />
        </div>
      </header>
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
