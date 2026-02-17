import type { Metadata } from "next";
import Link from "next/link";
import EntrepreneurAuthBar from "./auth-bar";
import ShortlistLink from "./shortlist-link";
import LastViewedLink from "./last-viewed-link";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Browse factories",
  description:
    "Find trustworthy factories for your hardware. Browse transparent audit answers, compare manufacturers by the same steps — receiving to shipping — and choose partners you can rely on.",
  openGraph: {
    title: "Browse factories | Factory Truth",
    description:
      "Compare factories by real audit answers. Same questions, same flow — so you see what actually happens inside.",
    url: "/entrepreneurs",
  },
};

export default function EntrepreneursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.portalLayout} lang="en">
      <header className={styles.portalHeader}>
        <Link href="/" className={styles.logo}>
          Factory Truth
        </Link>
        <span className={styles.badge}>For entrepreneurs</span>
        <div className={styles.navAndAuth}>
          <nav className={styles.nav}>
            <Link href="/entrepreneurs">Browse factories</Link>
            <ShortlistLink />
            <LastViewedLink />
            <Link href="/entrepreneurs/compare">Compare</Link>
            <Link href="/flow">The factory flow</Link>
            <Link href="/">Home</Link>
            <Link href="/factories" className="zh">工厂入口</Link>
          </nav>
          <EntrepreneurAuthBar />
        </div>
      </header>
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
