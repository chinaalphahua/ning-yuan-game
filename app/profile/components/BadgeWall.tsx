"use client";

import { motion } from "framer-motion";

type Badge = { key: string; name: string; description: string | null; icon: string | null; unlocked_at: string };
type Achievement = { key: string; name: string; description: string | null; icon: string | null; unlocked_at: string };

interface BadgeWallProps {
  badges: Badge[];
  achievements: Achievement[];
}

export default function BadgeWall({ badges, achievements }: BadgeWallProps) {
  const items = [...badges.map((b) => ({ ...b, type: "badge" as const })), ...achievements.map((a) => ({ ...a, type: "achievement" as const }))];

  if (items.length === 0) {
    return (
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">成就徽章</p>
        <p className="text-sm text-zinc-600">暂无解锁</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-zinc-600">成就徽章</p>
      <div className="grid grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={`${item.type}-${item.key}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass flex flex-col items-center rounded-lg p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg text-white/80">
              {item.icon === "star" ? "★" : item.icon === "flame" ? "🔥" : item.icon === "badge" ? "◆" : "◇"}
            </div>
            <p className="mt-2 truncate w-full text-center text-[10px] text-zinc-400">{item.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
