import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Snipp | Real-Time Collaborative Code Snippets with AI Search",
  description:
    "Snipp is a real-time collaborative code snippet manager with AI-powered search to help teams discover, share, and reuse code effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
