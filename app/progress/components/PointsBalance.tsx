"use client";

interface PointsBalanceProps {
  points: number;
}

export default function PointsBalance({ points }: PointsBalanceProps) {
  return (
    <div className="mb-10 flex items-baseline justify-center gap-2">
      <span className="font-mono text-2xl text-white/90 md:text-3xl">{points}</span>
      <span className="text-xs tracking-[0.2em] text-zinc-500">积分</span>
    </div>
  );
}
