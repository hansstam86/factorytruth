import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Factory Truth — See what really happens in the factory",
  description:
    "What actually happens inside the factory? Factories share it. Same questions, real answers — so you can choose manufacturing partners you actually trust.",
  openGraph: {
    title: "Factory Truth — See what really happens in the factory",
    description:
      "Factories share real answers. Entrepreneurs see what goes on inside — from receiving to shipping — and choose partners they can trust.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <main className={styles.landing}>
      <header className={styles.landingHeader}>
        <div className={styles.landingBrand}>Factory Truth</div>
        <nav className={styles.landingNav}>
          <Link href="/flow" className={styles.navLink}>
            The factory flow
          </Link>
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
          What actually happens in the factory.
          <br />
          <span className={styles.heroSub}>Factories share it. You see it.</span>
        </h1>
        <p className={styles.heroDesc}>
          Most factories follow the same path — receiving, quality checks, production, packing, shipping. We ask the same questions so you can compare real answers and choose partners you trust.
        </p>
        <div className={styles.flowPreview}>
          <span className={styles.flowStep}>Receiving</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Incoming quality</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Warehouse</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Kitting</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Production</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Packing</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowStep}>Shipping</span>
        </div>
        <div className={styles.heroActions}>
          <Link href="/factories" className={`${styles.btn} ${styles.btnPrimary} zh`}>
            工厂提交审核答案
          </Link>
          <Link href="/entrepreneurs" className={`${styles.btn} ${styles.btnSecondary}`}>
            Browse factories
          </Link>
          <Link href="/flow" className={styles.heroFlowLink}>
            See the full flow →
          </Link>
        </div>
      </section>

      <section className={styles.split}>
        <div className={styles.card}>
          <h2 className={`${styles.cardTitle} zh`}>工厂端</h2>
          <p className={`${styles.cardDesc} zh`}>
            让海外客户看清您工厂的真实情况。您分享的审核信息越完整，创业者越能了解您的生产与质量，越有可能将项目交给您。
          </p>
          <Link href="/factories" className={`${styles.cardLink} zh`}>
            进入工厂入口 →
          </Link>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>For entrepreneurs</h2>
          <p className={styles.cardDesc}>
            See what really happens inside the factories you’re considering.
            Same questions, real answers — compare and choose partners you can rely on.
          </p>
          <Link href="/entrepreneurs" className={styles.cardLink}>
            Go to entrepreneur portal →
          </Link>
        </div>
      </section>

      <footer className={styles.landingFooter}>
        <span>Factory Truth</span>
        <Link href="/flow">The factory flow</Link>
        <Link href="/factories" className="zh">工厂</Link>
        <Link href="/entrepreneurs">Entrepreneurs</Link>
      </footer>
    </main>
  );
}
