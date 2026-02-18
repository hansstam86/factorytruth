import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create an entrepreneur account to browse factory audits, save factories to your shortlist, and request access to private answers.",
  openGraph: {
    title: "Sign up | Factory Truth",
    description:
      "Create an account to browse factories and compare what really happens inside.",
    url: "/entrepreneurs/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
