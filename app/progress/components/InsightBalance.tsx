"use client";

interface InsightBalanceProps {
  insight: number;
}

export default function InsightBalance({ insight }: InsightBalanceProps) {
  return (
    <div className="mb-10 flex items-baseline justify-center gap-2">
      <span className="font-mono text-2xl text-white/90 md:text-3xl">
        {insight}
      </span>
      <span className="text-xs tracking-[0.2em] text-zinc-500">
        洞察
      </span>
    </div>
  );
}
