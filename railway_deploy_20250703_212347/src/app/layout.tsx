import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./compiled.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Marketing Automation - Campaign Creation on Autopilot",
  description: "Create, optimize, and scale marketing campaigns with AI. No expertise needed.",
  keywords: "AI marketing, campaign automation, Facebook ads, Instagram ads, marketing AI",
  authors: [{ name: "AI Marketing Automation CEO" }],
  openGraph: {
    title: "AI Marketing Automation - Campaign Creation on Autopilot",
    description: "Create perfect marketing campaigns in 30 seconds with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}