"use client";

import { levelToExp } from "@/lib/growth/level";
import { motion } from "framer-motion";

interface XpProgressBarProps {
  xp: number;
  level: number;
}

export default function XpProgressBar({ xp, level }: XpProgressBarProps) {
  const expAtCurrentLevel = levelToExp(level);
  const expAtNextLevel = levelToExp(level + 1);
  const expInLevel = xp - expAtCurrentLevel;
  const expNeededForNextLevel = expAtNextLevel - expAtCurrentLevel;
  const progress = expNeededForNextLevel > 0 ? (expInLevel / expNeededForNextLevel) * 100 : 100;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between text-[10px] tracking-wider text-zinc-500">
        <span>XP 进度</span>
        <span>{expInLevel} / {expNeededForNextLevel}</span>
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
