"use client";

import Link from "next/link";
import { getLevelTitle } from "@/constants/levelTitles";
import { getPrivilegeLink } from "@/constants/privilegeLinks";
import { PRIVILEGES_BY_LEVEL } from "@/constants/privilegesByLevel";
import { motion } from "framer-motion";

interface GrowthTimelineProps {
  level: number;
  unlockedPrivilegeKeys: Set<string>;
}

export default function GrowthTimeline({ level, unlockedPrivilegeKeys }: GrowthTimelineProps) {
  const nodes = Array.from({ length: level }, (_, i) => i + 1);
  return (
    <div>
      <p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
        成长时间轴
      </p>
      <div className="relative">
        {/* 垂直线 */}
        <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/[0.06]" />
        <div className="space-y-8">
          {nodes.map((lvl, i) => {
            const isCurrent = lvl === level;
            const privs = PRIVILEGES_BY_LEVEL[lvl] ?? [];
            const unlocked = privs.filter((p) => unlockedPrivilegeKeys.has(p.key));
            return (
              <motion.div
                key={lvl}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex gap-6"
              >
                <div
                  className={`relative z-10 h-3 w-3 shrink-0 rounded-full ${
                    isCurrent ? "border-2 border-white/50 bg-white/20" : "bg-white/10"
                  }`}
                />
                <div className="flex-1 pb-2">
                  <p className={`text-sm font-medium ${isCurrent ? "text-white/95" : "text-zinc-500"}`}>
                    Lv.{lvl} · {getLevelTitle(lvl)}
                    {isCurrent && <span className="ml-2 text-[10px] text-zinc-500">(当前)</span>}
                  </p>
                  {unlocked.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                      {unlocked.map((p) => {
                        const link = getPrivilegeLink(p.key);
                        return (
                          <li key={p.key}>
                            {link ? (
                              <Link href={link.href} className="text-zinc-600 transition hover:text-white/80 hover:underline">
                                {link.label}
                              </Link>
                            ) : (
                              p.name
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
