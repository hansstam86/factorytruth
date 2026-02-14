import Link from "next/link";
import AdminAuthBar from "./auth-bar";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.portalLayout} lang="en">
      <header className={styles.portalHeader}>
        <Link href="/admin" className={styles.logo}>
          Factory Truth — Admin
        </Link>
        <span className={styles.badge}>Admin</span>
        <div className={styles.navAndAuth}>
          <nav className={styles.nav}>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/factories">Factories</Link>
            <Link href="/admin/entrepreneurs">Entrepreneurs</Link>
            <Link href="/admin/questions">Edit questions</Link>
            <Link href="/">Home</Link>
          </nav>
          <AdminAuthBar />
        </div>
      </header>
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
