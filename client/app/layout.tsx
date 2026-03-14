import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cider — Brew iOS apps in the cloud",
  description: "macOS sandboxes as a service for AI coding agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
