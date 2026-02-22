"use client";

import { XP_PER_LEVEL } from "@/lib/growth/constants";
import { motion } from "framer-motion";

interface XpProgressBarProps {
  xp: number;
  level: number;
}

export default function XpProgressBar({ xp, level }: XpProgressBarProps) {
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress = (xpInLevel / XP_PER_LEVEL) * 100;
  const nextLevelXp = XP_PER_LEVEL;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between text-[10px] tracking-wider text-zinc-500">
        <span>XP 进度</span>
        <span>{xpInLevel} / {nextLevelXp}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-white/40"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
