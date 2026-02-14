"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  return (
    <div>
      <h1>Admin</h1>
      <p>Manage audit questions and settings.</p>
      <ul>
        <li>
          <Link href="/admin/questions">Edit questions</Link> — Change section names and question text (English and Chinese).
        </li>
      </ul>
    </div>
  );
}
