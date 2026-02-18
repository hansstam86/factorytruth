import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My shortlist",
  description:
    "Your saved factories on Factory Truth. Compare them side by side or request access to private answers.",
  openGraph: {
    title: "My shortlist | Factory Truth",
    description:
      "Your saved factories. Compare and request access to see what really happens inside.",
    url: "/entrepreneurs/shortlist",
  },
};

export default function ShortlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
