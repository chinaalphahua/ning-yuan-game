import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-serif-sc",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "宁愿 NingYuan",
  description: "极简哲学二选一游戏",
};

export const viewport = { viewportFit: "cover" as const };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} h-full overflow-hidden antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
