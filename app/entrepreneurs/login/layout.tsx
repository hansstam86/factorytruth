import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to the entrepreneur portal to browse factory audits, compare manufacturers, and request access to private answers.",
  openGraph: {
    title: "Log in | Factory Truth",
    description:
      "Log in to browse factories and see what really happens inside.",
    url: "/entrepreneurs/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
