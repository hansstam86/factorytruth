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
      <p>Manage factories, entrepreneurs, and audit questions.</p>
      <ul>
        <li>
          <Link href="/admin/factories">Factories</Link> — View, create, and delete factory accounts and their submissions.
        </li>
        <li>
          <Link href="/admin/entrepreneurs">Entrepreneurs</Link> — View, create, and delete entrepreneur accounts.
        </li>
        <li>
          <Link href="/admin/questions">Edit questions</Link> — Change section names and question text (English and Chinese).
        </li>
      </ul>
    </div>
  );
}
