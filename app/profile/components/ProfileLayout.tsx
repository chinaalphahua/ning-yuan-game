"use client";

import Link from "next/link";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="relative flex h-screen h-[100dvh] flex-col bg-[#0a0a0a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0a0a0a]">
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="profileOrbit" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="url(#profileOrbit)" strokeWidth="0.15" />
        </svg>
      </div>
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="text-[11px] uppercase tracking-widest text-zinc-500 transition hover:text-white/80">
          ← 返回
        </Link>
        <Link href="/progress" className="text-[11px] uppercase tracking-widest text-zinc-500 transition hover:text-white/80">
          成长进度
        </Link>
      </header>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 md:px-6 md:pt-12">
        {children}
      </main>
    </div>
  );
}
