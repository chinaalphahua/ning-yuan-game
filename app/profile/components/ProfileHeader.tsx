"use client";

import { getLevelTitle } from "@/constants/levelTitles";

interface ProfileHeaderProps {
  soulId: string;
  displayName: string | null;
  level: number;
}

export default function ProfileHeader({ soulId, displayName, level }: ProfileHeaderProps) {
  const title = getLevelTitle(level);
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] tracking-widest text-zinc-500">{soulId}</p>
      <h1 className="mt-2 font-serif text-2xl tracking-wide text-white/95 md:text-3xl">
        {displayName || "灵魂旅人"}
      </h1>
      <p className="mt-2 text-sm tracking-[0.2em] text-zinc-500">
        Lv.{level} · {title}
      </p>
    </div>
  );
}
