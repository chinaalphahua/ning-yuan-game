"use client";

import { motion } from "framer-motion";
import { STAT_KEYS } from "@/constants/statKeys";

export default function SoulRadar({
  stats,
  className = "",
}: {
  stats: Record<string, number>;
  className?: string;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 8;
  const count = STAT_KEYS.length;
  const angleStep = (2 * Math.PI) / count;

  const points = STAT_KEYS.map((key, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = ((stats[key] ?? 50) / 100) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  const gridPoints = [0.25, 0.5, 0.75, 1].map((scale) =>
    STAT_KEYS.map((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = scale * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ")
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className}>
      {gridPoints.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
      ))}
      {STAT_KEYS.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + maxR * Math.cos(angle);
        const y = cy + maxR * Math.sin(angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        );
      })}
      <motion.polygon
        points={points}
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
        initial={false}
        animate={{ points }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </svg>
  );
}
