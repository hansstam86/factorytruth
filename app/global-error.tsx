"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          color: "#1a1a1a",
          background: "#fff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666", marginBottom: "1.5rem", textAlign: "center" }}>
          We’ve run into an error. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fff",
            background: "#2b7db8",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <nav style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/" style={{ color: "#2b7db8", fontWeight: 600 }}>
            Home
          </a>
          <a href="/flow" style={{ color: "#2b7db8", fontWeight: 600 }}>
            The factory flow
          </a>
          <a href="/entrepreneurs" style={{ color: "#2b7db8", fontWeight: 600 }}>
            Browse factories
          </a>
        </nav>
      </body>
    </html>
  );
}
