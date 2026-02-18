import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare factories",
  description:
    "Side-by-side comparison of factory audit answers. See how different manufacturers handle receiving, quality, production, and shipping — same questions, real answers.",
  openGraph: {
    title: "Compare factories | Factory Truth",
    description:
      "Compare factories by real audit answers. Same questions, same flow — see what actually happens inside.",
    url: "/entrepreneurs/compare",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
