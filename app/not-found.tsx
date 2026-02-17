import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        color: "var(--color-text, #1a1a1a)",
        background: "var(--color-bg, #fff)",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Page not found
      </h1>
      <p style={{ color: "var(--color-text-muted, #666)", marginBottom: "1.5rem" }}>
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            color: "var(--color-accent, #2b7db8)",
            fontWeight: 600,
          }}
        >
          Home
        </Link>
        <Link
          href="/flow"
          style={{
            color: "var(--color-accent, #2b7db8)",
            fontWeight: 600,
          }}
        >
          The factory flow
        </Link>
        <Link
          href="/entrepreneurs"
          style={{
            color: "var(--color-accent, #2b7db8)",
            fontWeight: 600,
          }}
        >
          Browse factories
        </Link>
      </nav>
    </main>
  );
}
