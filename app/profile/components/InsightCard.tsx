"use client";

import { motion } from "framer-motion";

type InsightRecord = {
  id: string;
  content: string;
  depth_score: number | null;
  ai_comment: string | null;
  insight_rank: string | null;
  source: string;
  created_at: string;
};

interface InsightCardProps {
  record: InsightRecord;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function InsightCard({ record, isFlipped, onFlip }: InsightCardProps) {
  const date = new Date(record.created_at).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      className="perspective-1000 cursor-pointer"
      onClick={onFlip}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <motion.div
        className="relative h-36 w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        {/* 正面：content + 深度 + 等级 */}
        <div
          className="glass absolute inset-0 flex flex-col justify-between rounded-lg p-4"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">{record.content || "—"}</p>
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>{date}</span>
            <span>
              {record.depth_score != null && `深度 ${record.depth_score}`}
              {record.insight_rank && ` · ${record.insight_rank}`}
            </span>
          </div>
        </div>
        {/* 背面：AI 批语 */}
        <div
          className="glass-md absolute inset-0 flex flex-col justify-center rounded-lg p-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">AI 批语</p>
          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-zinc-300">
            {record.ai_comment || "暂无批语"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
