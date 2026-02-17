import type { Metadata, Viewport } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.factorytruth.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Factory Truth — See what really happens in the factory",
    template: "%s | Factory Truth",
  },
  description:
    "Factories share real answers to the same questions. Entrepreneurs see what actually goes on inside — from receiving to shipping — and choose manufacturing partners they can trust.",
  openGraph: {
    title: "Factory Truth — See what really happens in the factory",
    description:
      "Factories share real answers to the same questions. Entrepreneurs see what actually goes on inside and choose partners they can trust.",
    url: "/",
    siteName: "Factory Truth",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Factory Truth — See what really happens in the factory",
    description:
      "Factories share real answers. Entrepreneurs see what goes on inside — and choose partners they can trust.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
