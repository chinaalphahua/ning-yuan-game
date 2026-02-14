"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, Impact } from "./questions";
import {
  RESONANCE_WHISPERS,
  RESONANCE_POSITIONS,
  type ResonancePosition,
} from "@/constants/resonance";

const STAT_KEYS = [
  "金钱",
  "健康",
  "情感",
  "智慧",
  "权力",
  "外貌",
  "自我",
  "自由",
  "家庭",
] as const;

const INIT_STATS: Record<string, number> = Object.fromEntries(
  STAT_KEYS.map((k) => [k, 50])
);

const STAGE_TITLES: Record<string, { title: string; phrase: string }> = {
  金钱: { title: "「金钱的信徒」", phrase: "财富是自由的枷锁，你正忙着锁上它。" },
  健康: { title: "「惜命的凡人」", phrase: "你在恐惧终点，所以拒绝了起跑。" },
  情感: { title: "「情感的囚徒」", phrase: "你为心跳定价，却忘了心跳无价。" },
  智慧: { title: "「清醒的痛苦者」", phrase: "看破一切的代价，是再也无法入戏。" },
  权力: { title: "「权力的信徒」", phrase: "你握紧权杖时，影子吞没了你。" },
  外貌: { title: "「容颜的奴隶」", phrase: "你照镜子时，看见的是别人的目光。" },
  自我: { title: "「极致的自恋者」", phrase: "全世界都消失了，只剩下你一个人。" },
  自由: { title: "「荒野的孤魂」", phrase: "当你无所牵绊，也就无处停靠。" },
  家庭: { title: "「归巢的候鸟」", phrase: "你飞得再高，线头还在他们手里。" },
};

const SAVE_KEY = "ningyuan_progress";

function getSacrificeRecap(
  impactHistory: Record<string, number>[]
): { for: string; sacrificed: string; count: number }[] {
  const pairCount: Record<string, number> = {};
  impactHistory.forEach((impact) => {
    let maxGain = -1;
    let maxLoss = 1;
    let gainKey: string = STAT_KEYS[0];
    let lossKey: string = STAT_KEYS[0];
    STAT_KEYS.forEach((k) => {
      const v = impact[k] ?? 0;
      if (v > maxGain) {
        maxGain = v;
        gainKey = k;
      }
      if (v < maxLoss) {
        maxLoss = v;
        lossKey = k;
      }
    });
    if (maxGain > 0 && maxLoss < 0) {
      const key = `${gainKey}|${lossKey}`;
      pairCount[key] = (pairCount[key] ?? 0) + 1;
    }
  });
  return Object.entries(pairCount)
    .map(([key, count]) => {
      const [forAttr, sacrificed] = key.split("|");
      return { for: forAttr, sacrificed, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
}

const FATE_WHISPERS = [
  "每一个选择都是在杀死另一个自己",
  "别害怕，你只是更爱你自己",
  "你选中的不是答案，是你愿意承受的代价",
  "没有对错，只有取舍",
  "灵魂在二选一里慢慢成形",
  "你犹豫的每一秒，都是两个你在争夺",
  "选完就别回头，回头才是地狱",
  "命运不会审判你，只会记录你",
];

function pickRatio(): [number, number] {
  const a = 25 + Math.floor(Math.random() * 50);
  return [a, 100 - a];
}

function shuffleOrder(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getTopAttribute(stats: Record<string, number>): (typeof STAT_KEYS)[number] {
  let maxVal = -1;
  let key: (typeof STAT_KEYS)[number] = STAT_KEYS[0];
  STAT_KEYS.forEach((k) => {
    const v = stats[k] ?? 0;
    if (v > maxVal) {
      maxVal = v;
      key = k;
    }
  });
  return key;
}

function getDominantAttribute(
  before: Record<string, number>,
  after: Record<string, number>
): (typeof STAT_KEYS)[number] {
  let maxDelta = -1;
  let key: (typeof STAT_KEYS)[number] = STAT_KEYS[0];
  STAT_KEYS.forEach((k) => {
    const d = (after[k] ?? 0) - (before[k] ?? 0);
    if (d > maxDelta) {
      maxDelta = d;
      key = k;
    }
  });
  return key;
}

export default function NingYuanGame() {
  const [questionOrder, setQuestionOrder] = useState<number[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<null | "A" | "B">(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({ ...INIT_STATS });
  const [lastChangedKeys, setLastChangedKeys] = useState<string[]>([]);
  const [displayRatio, setDisplayRatio] = useState<[number, number]>([50, 50]);
  const [stageStartStats, setStageStartStats] = useState<Record<string, number>>({ ...INIT_STATS });
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageTitle, setStageTitle] = useState("");
  const [stagePhrase, setStagePhrase] = useState("");
  const [whisperText, setWhisperText] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [resonanceWhisper, setResonanceWhisper] = useState<{
    text: string;
    position: ResonancePosition;
  } | null>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const statsRef = useRef(stats);
  const prevTopAttrRef = useRef<string | null>(null);
  const impactHistoryRef = useRef<Record<string, number>[]>([]);
  statsRef.current = stats;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as {
          currentIndex?: number;
          stats?: Record<string, number>;
          questionOrder?: number[];
          completed?: boolean;
          impactHistory?: Record<string, number>[];
        };
        if (
          Array.isArray(data.questionOrder) &&
          data.questionOrder.length === questions.length &&
          data.stats &&
          typeof data.stats === "object"
        ) {
          const idx = typeof data.currentIndex === "number" ? data.currentIndex : 0;
          const completed = data.completed === true;
          setQuestionOrder(data.questionOrder);
          setCurrentIndex(Math.min(idx, questions.length - 1));
          setStats(data.stats);
          if (Array.isArray(data.impactHistory)) {
            impactHistoryRef.current = data.impactHistory;
          }
          if (completed) setShowFinalReport(true);
          return;
        }
      }
    } catch (_) {}
    setQuestionOrder(shuffleOrder(questions.length));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || questionOrder === null) return;
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          currentIndex,
          stats,
          questionOrder,
          completed: showFinalReport,
          impactHistory: impactHistoryRef.current,
        })
      );
    } catch (_) {}
  }, [currentIndex, stats, questionOrder, showFinalReport]);

  const total = questions.length;
  const currentQuestion =
    questionOrder !== null
      ? questions[questionOrder[currentIndex]]
      : questions[0];
  const progress = (currentIndex + 1) / total;

  useEffect(() => {
    if (selected !== null) return;
    const pool = [...FATE_WHISPERS];
    const pick = () => setWhisperText(pool[Math.floor(Math.random() * pool.length)]);
    pick();
    const t = setInterval(pick, 6000 + Math.random() * 2000);
    return () => clearInterval(t);
  }, [selected]);

  const handleSelect = useCallback(
    (choice: "A" | "B") => {
      if (selected || !currentQuestion) return;
      setSelected(choice);
      setShakeKey((k) => k + 1);
      const impact: Impact =
        choice === "A" ? currentQuestion.impactA : currentQuestion.impactB;
      const keys = Object.keys(impact).filter(
        (k) => impact[k as keyof Impact] !== 0
      );
      setLastChangedKeys(keys);
      const nextStats = { ...stats };
      (
        Object.entries(impact) as [keyof Impact, number][]
      ).forEach(([key, value]) => {
        if (nextStats[key] !== undefined && value != null) {
          nextStats[key] = Math.max(
            0,
            Math.min(100, nextStats[key] + value)
          );
        }
      });
      setStats(nextStats);

      const topAttr = getTopAttribute(nextStats);
      const topVal = nextStats[topAttr] ?? 0;
      const impactRecord = Object.fromEntries(
        (Object.entries(impact) as [keyof Impact, number][]).map(([k, v]) => [
          k,
          v ?? 0,
        ])
      ) as Record<string, number>;
      impactHistoryRef.current = [...impactHistoryRef.current, impactRecord];

      const topChanged =
        (prevTopAttrRef.current === null && topVal > 60) ||
        (prevTopAttrRef.current !== null && prevTopAttrRef.current !== topAttr);
      prevTopAttrRef.current = topAttr;
      const shouldTriggerByChange =
        topChanged && topVal > 60 && RESONANCE_WHISPERS[topAttr];
      const shouldTriggerBy80 =
        topVal > 80 && RESONANCE_WHISPERS[topAttr];
      const shouldTrigger = shouldTriggerByChange || shouldTriggerBy80;
      if (shouldTrigger) {
        const pos =
          RESONANCE_POSITIONS[
            Math.floor(Math.random() * RESONANCE_POSITIONS.length)
          ];
        setResonanceWhisper({
          text: RESONANCE_WHISPERS[topAttr],
          position: pos,
        });
        setTimeout(() => setResonanceWhisper(null), 10000);
      }
      setDisplayRatio(pickRatio());
      setTimeout(() => setShowResult(true), 400);
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= total) {
          setShowFinalReport(true);
        } else if (nextIndex % 10 === 0) {
          const impact: Impact =
            choice === "A" ? currentQuestion.impactA : currentQuestion.impactB;
          const afterStats = { ...stats };
          (
            Object.entries(impact) as [keyof Impact, number][]
          ).forEach(([key, value]) => {
            if (afterStats[key] !== undefined && value != null) {
              afterStats[key] = Math.max(
                0,
                Math.min(100, afterStats[key] + value)
              );
            }
          });
          const dominant = getDominantAttribute(stageStartStats, afterStats);
          const meta = STAGE_TITLES[dominant] ?? STAGE_TITLES["自我"];
          setStageTitle(meta.title);
          setStagePhrase(meta.phrase);
          setShowStageModal(true);
        } else {
          setCurrentIndex(nextIndex);
          setSelected(null);
          setShowResult(false);
          setLastChangedKeys([]);
        }
      }, 2500);
    },
    [
      selected,
      currentQuestion,
      currentIndex,
      total,
      stageStartStats,
      stats,
    ]
  );

  const closeStageModal = useCallback(() => {
    setShowStageModal(false);
    setCurrentIndex((prev) => prev + 1);
    setSelected(null);
    setShowResult(false);
    setLastChangedKeys([]);
    setStageStartStats(() => ({ ...statsRef.current }));
  }, []);

  const restart = useCallback(() => {
    if (typeof window !== "undefined") try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) {}
    impactHistoryRef.current = [];
    prevTopAttrRef.current = null;
    setShowFinalReport(false);
    setQuestionOrder(shuffleOrder(questions.length));
    setCurrentIndex(0);
    setStats({ ...INIT_STATS });
    setStageStartStats({ ...INIT_STATS });
    setSelected(null);
    setShowResult(false);
    setLastChangedKeys([]);
  }, []);

  if (questionOrder === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-6 w-6 animate-pulse rounded-full border border-white/20" />
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="h-screen w-full bg-black" />;
  }

  if (showFinalReport) {
    const topAttr = getTopAttribute(stats);
    const meta = STAGE_TITLES[topAttr] ?? STAGE_TITLES["自我"];
    const recap = getSacrificeRecap(impactHistoryRef.current);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white px-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          终极镜像
        </p>
        <h1 className="mt-4 font-serif text-2xl tracking-wide text-white/95 md:text-3xl">
          {meta.title}
        </h1>
        <div className="mt-8 h-40 w-40 shrink-0">
          <SoulRadar stats={stats} className="h-full w-full" />
        </div>
        <div className="mt-6 max-w-sm space-y-2 text-center text-sm leading-relaxed text-zinc-400">
          {recap.length > 0 ? (
            recap.map((r) => (
              <p key={`${r.for}-${r.sacrificed}`}>
                你为了{r.for}牺牲了{r.sacrificed} {r.count} 次。
              </p>
            ))
          ) : (
            <p>你的灵魂画像已定。</p>
          )}
        </div>
        <motion.button
          type="button"
          onClick={restart}
          className="mt-10 min-h-[48px] min-w-[160px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15"
          whileTap={{ scale: 0.98 }}
        >
          重启轮回
        </motion.button>
      </div>
    );
  }

  return (
    <motion.main
      key={shakeKey}
      initial={{ x: 0 }}
      animate={{ x: shakeKey > 0 ? [0, -5, 5, -3, 3, 0] : 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex h-screen w-full flex-col overflow-hidden bg-black font-sans text-white select-none"
    >
      {/* 顶部极细进度条 */}
      <div className="absolute left-0 right-0 top-0 z-30 h-0.5 bg-zinc-900">
        <motion.div
          className="h-full bg-white/40"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 情境区 */}
      <div
        className="absolute left-0 right-0 top-[12%] z-10 px-6 text-center pointer-events-none"
        style={{ top: "16%" }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuestion.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-normal tracking-[0.2em] text-zinc-500 md:text-sm"
          >
            {currentQuestion.question_title}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 抉择区：上下平分 */}
      <div className="relative flex flex-1 flex-col pt-10 min-h-0">
        <OptionCard
          side="A"
          text={currentQuestion.optionA_text}
          isActive={selected === "A"}
          isDimmed={selected === "B"}
          isIdle={selected === null}
          onSelect={() => handleSelect("A")}
          showResult={showResult}
          ratio={displayRatio[0]}
        />
        <OptionCard
          side="B"
          text={currentQuestion.optionB_text}
          isActive={selected === "B"}
          isDimmed={selected === "A"}
          isIdle={selected === null}
          onSelect={() => handleSelect("B")}
          showResult={showResult}
          ratio={displayRatio[1]}
        />
      </div>

      {/* 灵魂感应：stats 更新后按条件浮现 */}
      <AnimatePresence>
        {resonanceWhisper && (
          <motion.p
            key={resonanceWhisper.text + resonanceWhisper.position}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.75, 0],
              transition: { duration: 10 },
            }}
            exit={{ opacity: 0 }}
            className={`absolute z-40 max-w-[260px] text-base italic text-white pointer-events-none ${
              resonanceWhisper.position === "topLeft"
                ? "left-8 top-28"
                : resonanceWhisper.position === "topRight"
                  ? "right-8 top-28"
                  : "bottom-28 left-1/2 -translate-x-1/2"
            }`}
          >
            {resonanceWhisper.text}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 命运的低语：未选择时浮现 */}
      <AnimatePresence>
        {selected === null && whisperText && (
          <motion.p
            key={whisperText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 z-5 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-6 text-center text-sm italic text-white pointer-events-none"
          >
            {whisperText}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 芒星 / 灵魂雷达：居中替代 OR */}
      <div className="absolute left-1/2 top-1/2 z-20 h-20 w-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:h-24 md:w-24">
        <SoulRadar stats={stats} className="h-full w-full" />
      </div>

      {/* 底部属性条 */}
      <footer className="flex shrink-0 justify-center gap-3 border-t border-zinc-900/80 bg-zinc-950/50 px-4 py-2.5">
        {STAT_KEYS.map((name) => (
          <StatBar
            key={name}
            name={name}
            value={stats[name]}
            highlight={lastChangedKeys.includes(name)}
          />
        ))}
      </footer>

      {/* 阶段性镜像 Modal */}
      <AnimatePresence>
        {showStageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 px-6"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              阶段性镜像
            </p>
            <h2 className="mt-4 font-serif text-2xl tracking-wide text-white/95 md:text-3xl">
              {stageTitle}
            </h2>
            <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
              {stagePhrase}
            </p>
            <motion.button
              type="button"
              onClick={closeStageModal}
              className="mt-10 min-h-[48px] min-w-[160px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15"
              whileTap={{ scale: 0.98 }}
            >
              继续试炼
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function SoulRadar({
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

type OptionCardProps = {
  side: "A" | "B";
  text: string;
  isActive: boolean;
  isDimmed: boolean;
  isIdle: boolean;
  onSelect: () => void;
  showResult: boolean;
  ratio: number;
};

function OptionCard({
  side,
  text,
  isActive,
  isDimmed,
  isIdle,
  onSelect,
  showResult,
  ratio,
}: OptionCardProps) {
  return (
    <motion.div
      onClick={onSelect}
      className={`relative flex flex-1 flex items-center justify-center px-6 py-6 cursor-pointer transition-all duration-500 min-h-0
        ${isActive ? "bg-zinc-900/60 backdrop-blur-md" : "bg-black"}
        ${isDimmed ? "opacity-20" : "opacity-100"}
        ${side === "A" ? "border-b border-white/5" : ""}`}
      animate={{
        boxShadow:
          isIdle && !isDimmed
            ? [
                "0 0 0 1px rgba(255,255,255,0.05)",
                "0 0 0 1px rgba(255,255,255,0.12)",
                "0 0 0 1px rgba(255,255,255,0.05)",
              ]
            : "0 0 0 1px rgba(255,255,255,0.06)",
      }}
      transition={{
        boxShadow:
          isIdle && !isDimmed
            ? { duration: 2.5, repeat: Infinity, repeatType: "reverse" }
            : { duration: 0.2 },
      }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="max-w-lg text-center">
        <h2 className="font-extralight leading-relaxed tracking-wide text-2xl text-white/95 md:text-3xl">
          {text}
        </h2>
      </div>
      {showResult && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 right-3 font-serif text-xs italic text-white/40 md:bottom-3 md:right-5 md:text-sm"
        >
          {ratio}%
        </motion.span>
      )}
    </motion.div>
  );
}

function StatBar({
  name,
  value,
  highlight,
}: {
  name: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-5 w-3 flex-col justify-end overflow-hidden rounded-sm bg-zinc-900">
        <motion.div
          className="w-full rounded-sm bg-white/35"
          initial={false}
          animate={{ height: `${value}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ minHeight: value > 0 ? 2 : 0 }}
        />
      </div>
      <span
        className={`text-[8px] tracking-wider transition-colors ${
          highlight ? "text-white/90" : "text-zinc-600"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
