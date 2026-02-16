import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.landing}>
      <header className={styles.landingHeader}>
        <div className={styles.landingBrand}>Factory Truth</div>
        <nav className={styles.landingNav}>
          <Link href="/factories" className={`${styles.navLink} zh`}>
            工厂入口
          </Link>
          <Link href="/entrepreneurs" className={styles.navLink}>
            For entrepreneurs
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Transparent factory audits.
          <br />
          <span className={styles.heroSub}>One platform, two sides.</span>
        </h1>
        <p className={styles.heroDesc}>
          Factories in China answer audit questions. Hardware entrepreneurs in
          Europe discover and select the right manufacturing partner.
        </p>
        <div className={styles.heroActions}>
          <Link href="/factories" className={`${styles.btn} ${styles.btnPrimary} zh`}>
            工厂提交审核答案
          </Link>
          <Link href="/entrepreneurs" className={`${styles.btn} ${styles.btnSecondary}`}>
            Browse factories
          </Link>
        </div>
      </section>

      <section className={styles.split}>
        <div className={styles.card}>
          <h2 className={`${styles.cardTitle} zh`}>工厂端</h2>
          <p className={`${styles.cardDesc} zh`}>
            找到更多优质客户。您分享的审核信息越完整、越透明，海外创业者越信任您，越有可能将硬件项目交给您生产。
          </p>
          <Link href="/factories" className={`${styles.cardLink} zh`}>
            进入工厂入口 →
          </Link>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>For entrepreneurs</h2>
          <p className={styles.cardDesc}>
            Find trustworthy factories for your hardware. Browse transparent audit
            answers, compare manufacturers, and choose partners you can rely on.
          </p>
          <Link href="/entrepreneurs" className={styles.cardLink}>
            Go to entrepreneur portal →
          </Link>
        </div>
      </section>

      <footer className={styles.landingFooter}>
        <span>Factory Truth</span>
        <Link href="/factories" className="zh">工厂</Link>
        <Link href="/entrepreneurs">Entrepreneurs</Link>
      </footer>
    </main>
  );
}
