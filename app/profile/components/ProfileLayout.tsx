"use client";

import Link from "next/link";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="relative flex h-screen h-[100dvh] flex-col bg-[#08080f] text-white">
      <div className="glass-bg" aria-hidden />
      <header className="glass-panel glass-iridescent relative z-10 flex shrink-0 items-center justify-between rounded-b-2xl border-b border-white/[0.08] px-5 py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="text-xs font-medium uppercase tracking-widest text-white/70 transition hover:text-white">
          ← 返回
        </Link>
        <Link href="/progress" className="text-xs font-medium uppercase tracking-widest text-white/70 transition hover:text-white">
          成长进度
        </Link>
      </header>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 md:px-6 md:pt-14">
        {children}
      </main>
    </div>
  );
}
