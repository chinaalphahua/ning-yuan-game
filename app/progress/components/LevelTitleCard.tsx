"use client";

import { getLevelTitle } from "@/constants/levelTitles";

interface LevelTitleCardProps {
  level: number;
}

export default function LevelTitleCard({ level }: LevelTitleCardProps) {
  const title = getLevelTitle(level);
  return (
    <div className="mb-10 text-center">
      <p className="font-serif text-3xl tracking-wide text-white/95 md:text-4xl lg:text-5xl">
        Lv.{level}
      </p>
      <p className="mt-2 text-sm tracking-[0.2em] text-zinc-500">
        {title}
      </p>
    </div>
  );
}
