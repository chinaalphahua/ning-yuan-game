"use client";

import { levelToExp } from "@/lib/growth/level";
import { motion } from "framer-motion";

interface DataPanelProps {
  level: number;
  xp: number;
  points: number;
  insight: number;
}

export default function DataPanel({ level, xp, points, insight }: DataPanelProps) {
  const expAtCurrent = levelToExp(level);
  const expAtNext = levelToExp(level + 1);
  const expInLevel = xp - expAtCurrent;
  const expNeeded = expAtNext - expAtCurrent;
  const progress = expNeeded > 0 ? (expInLevel / expNeeded) * 100 : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-[10px] tracking-wider text-zinc-500">
        <span>经验进度</span>
        <span>{expInLevel} / {expNeeded}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-white/40"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-xl text-white/90">{xp}</p>
          <p className="mt-1 text-[10px] tracking-wider text-zinc-500">经验</p>
        </div>
        <div className="rounded border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-xl text-white/90">{points}</p>
          <p className="mt-1 text-[10px] tracking-wider text-zinc-500">积分</p>
        </div>
        <div className="rounded border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-xl text-white/90">{insight}</p>
          <p className="mt-1 text-[10px] tracking-wider text-zinc-500">洞察</p>
        </div>
      </div>
    </div>
  );
}
