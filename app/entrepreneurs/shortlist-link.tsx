"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getShortlistIds } from "@/lib/shortlist";

export default function ShortlistLink() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => setCount(getShortlistIds().length);
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("factorytruth-shortlist-change", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("factorytruth-shortlist-change", updateCount);
    };
  }, []);

  return (
    <Link href="/entrepreneurs/shortlist">
      Shortlist{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
