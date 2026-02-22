"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InsightCard from "./InsightCard";

type InsightRecord = {
  id: string;
  content: string;
  depth_score: number | null;
  ai_comment: string | null;
  insight_rank: string | null;
  source: string;
  created_at: string;
};

interface InsightTimelineProps {
  records: InsightRecord[];
}

export default function InsightTimeline({ records }: InsightTimelineProps) {
  const [flippedId, setFlippedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">Insight 时间轴</p>
        <p className="text-sm text-zinc-600">暂无 Insight 记录</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-zinc-600">Insight 时间轴</p>
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {records.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <InsightCard
                record={r}
                isFlipped={flippedId === r.id}
                onFlip={() => setFlippedId((prev) => (prev === r.id ? null : r.id))}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
