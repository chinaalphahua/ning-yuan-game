"use client";

import { motion } from "framer-motion";

/** 深色底 + 星轨感背景，低对比 */
export default function StarfieldBackground() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: Math.random() * 1.5 + 0.5,
    opacity: 0.1 + Math.random() * 0.2,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0a0a0a]">
      {/* 细弧线：星轨感 */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="url(#orbitGrad)" strokeWidth="0.15" />
        <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="url(#orbitGrad)" strokeWidth="0.1" transform="rotate(-15 50 50)" />
      </svg>
      {/* 星点 */}
      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s) => (
          <motion.circle
            key={s.id}
            cx={`${s.cx}%`}
            cy={`${s.cy}%`}
            r={s.r}
            fill="white"
            initial={{ opacity: s.opacity }}
            animate={{ opacity: [s.opacity, s.opacity * 0.6, s.opacity] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
          />
        ))}
      </svg>
    </div>
  );
}
