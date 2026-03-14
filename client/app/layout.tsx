import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const bodyFont = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Cider",
  description: "Landing page for Cider macOS sandboxes and remote iOS builds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
