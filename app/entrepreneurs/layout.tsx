import Link from "next/link";
import EntrepreneurAuthBar from "./auth-bar";
import styles from "./layout.module.css";

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
