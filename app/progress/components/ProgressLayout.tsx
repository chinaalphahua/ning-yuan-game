"use client";

import Link from "next/link";
import StarfieldBackground from "./StarfieldBackground";

interface ProgressLayoutProps {
  children: React.ReactNode;
}

export default function ProgressLayout({ children }: ProgressLayoutProps) {
  return (
    <div className="relative flex h-screen h-[100dvh] flex-col bg-[#0a0a0a] text-white">
      <StarfieldBackground />
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-widest text-zinc-500 transition hover:text-white/80"
        >
          ← 返回
        </Link>
        <Link
          href="/profile"
          className="text-[11px] uppercase tracking-widest text-zinc-500 transition hover:text-white/80"
        >
          个人主页
        </Link>
      </header>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 md:px-6 md:pt-12">
        {children}
      </main>
    </div>
  );
}
