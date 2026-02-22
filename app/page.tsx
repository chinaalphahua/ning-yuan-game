"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, Impact } from "./questions";
import {
  RESONANCE_WHISPERS,
  RESONANCE_POSITIONS,
  type ResonancePosition,
} from "@/constants/resonance";
import { xpToLevel, levelToExp } from "@/lib/growth/level";

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
const SOUL_ID_KEY = "soul_id";

/** 每次选择奖励 */
const REWARD_XP = 5;
const REWARD_POINTS = 10;
const REWARD_INSIGHT = 1;

/** 题目加减分强度系数，大于 1 时变化更剧烈 */
const IMPACT_MULTIPLIER = 1.5;

const SOUL_MATE_TIERS = [20, 40, 60, 80, 100] as const;

function generateSoulId(): string {
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `NO.NY-${n}-X`;
}

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
  const [resonanceWhisper, setResonanceWhisper] = useState<{
    text: string;
    position: ResonancePosition;
  } | null>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showNoEditHint, setShowNoEditHint] = useState(false);
  const [soulId, setSoulId] = useState<string>("");
  const [user, setUser] = useState<{ id: string; soul_id: string; display_name: string | null } | null>(null);
  const [showSoulMateLayer, setShowSoulMateLayer] = useState(false);
  const [soulMateTier, setSoulMateTier] = useState<number>(20);
  const [soulMateMatches, setSoulMateMatches] = useState<{ soul_id: string; resonance: number; stats?: Record<string, number> }[]>([]);
  const [pendingSoulMateNextIndex, setPendingSoulMateNextIndex] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similarMaxTier, setSimilarMaxTier] = useState<number | null>(null);
  const [similarMatches, setSimilarMatches] = useState<{ soul_id: string; resonance: number; stats?: Record<string, number> }[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [growth, setGrowth] = useState<{ level: number; xp: number; points: number; insight: number; privileges: string[] } | null>(null);
  const [rewardToast, setRewardToast] = useState<{ xp: number; points: number; insight: number } | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ level: number; newPrivileges: { key: string; name: string }[] } | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [localXp, setLocalXp] = useState(0);
  const [localInsight, setLocalInsight] = useState(0);
  const statsRef = useRef(stats);
  const prevTopAttrRef = useRef<string | null>(null);
  const impactHistoryRef = useRef<Record<string, number>[]>([]);
  const resonanceLastShownAtRef = useRef<number>(-999);
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
          localXp?: number;
          localInsight?: number;
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
          if (typeof data.localXp === "number" && data.localXp >= 0) setLocalXp(data.localXp);
          if (typeof data.localInsight === "number" && data.localInsight >= 0) setLocalInsight(data.localInsight);
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
          localXp,
          localInsight,
        })
      );
    } catch (_) {}
  }, [currentIndex, stats, questionOrder, showFinalReport, localXp, localInsight]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let id = localStorage.getItem(SOUL_ID_KEY);
      if (!id) {
        id = generateSoulId();
        localStorage.setItem(SOUL_ID_KEY, id);
      }
      setSoulId(id);
    } catch (_) {}
  }, []);

  const fetchUser = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setUser(d.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const fetchGrowth = useCallback(() => {
    if (!user?.id) return;
    fetch("/api/growth")
      .then((r) => r.json())
      .then((d) => {
        if (d?.level != null && d?.xp != null)
          setGrowth({
            level: d.level,
            xp: d.xp,
            points: d.points ?? 0,
            insight: d.insight ?? 0,
            privileges: Array.isArray(d.privilege_keys)
              ? d.privilege_keys
              : Array.isArray(d.privileges)
                ? d.privileges.map((p: { key: string } | string) => (typeof p === "string" ? p : p.key))
                : [],
          });
        else setGrowth(null);
      })
      .catch(() => setGrowth(null));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setGrowth(null);
      return;
    }
    fetchGrowth();
  }, [user?.id, fetchGrowth]);

  useEffect(() => {
    if (!user?.id) {
      setSimilarMaxTier(null);
      setSimilarMatches([]);
      return;
    }
    setSimilarLoading(true);
    fetch("/api/play/me")
      .then((r) => r.json())
      .then((d) => {
        const tier = d?.maxTier ?? null;
        setSimilarMaxTier(tier);
        if (tier != null) {
          return fetch(`/api/soul-mates?tier=${tier}`).then((r) => r.json());
        }
        setSimilarMatches([]);
      })
      .then((d) => {
        if (d?.matches) setSimilarMatches(d.matches);
      })
      .catch(() => setSimilarMatches([]))
      .finally(() => setSimilarLoading(false));
  }, [user?.id]);

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

  useEffect(() => {
    if (!showSoulMateLayer || !soulMateTier) return;
    const statsSnapshot = statsRef.current;
    if (user) {
      fetch("/api/play/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: soulMateTier, stats: statsSnapshot }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.matches?.length) setSoulMateMatches(d.matches);
          else setSoulMateMatches([]);
        })
        .catch(() => setSoulMateMatches([]));
    } else {
      setSoulMateMatches([
        { soul_id: `NO.NY-${1000 + Math.floor(Math.random() * 9000)}-A`, resonance: 85 + Math.floor(Math.random() * 14) },
        { soul_id: `NO.NY-${1000 + Math.floor(Math.random() * 9000)}-B`, resonance: 85 + Math.floor(Math.random() * 14) },
        { soul_id: `NO.NY-${1000 + Math.floor(Math.random() * 9000)}-C`, resonance: 85 + Math.floor(Math.random() * 14) },
      ]);
    }
  }, [showSoulMateLayer, soulMateTier, user?.id]);

  const handleSelect = useCallback(
    (choice: "A" | "B") => {
      if (selected || !currentQuestion) return;
      setSelected(choice);
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
          const delta = Math.round(value * IMPACT_MULTIPLIER);
          nextStats[key] = Math.max(
            0,
            Math.min(100, nextStats[key] + delta)
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
      const cooldownOk = currentIndex - resonanceLastShownAtRef.current >= 2;
      const shouldTrigger =
        topChanged && topVal > 60 && RESONANCE_WHISPERS[topAttr] && cooldownOk;
      if (shouldTrigger) {
        resonanceLastShownAtRef.current = currentIndex;
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

      setRewardToast({ xp: REWARD_XP, points: REWARD_POINTS, insight: REWARD_INSIGHT });
      setTimeout(() => setRewardToast(null), 1500);

      if (user?.id) {
        const prevLevel = growth?.level ?? 1;
        const prevPrivs = new Set(growth?.privileges ?? []);
        fetch("/api/progress/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xp_delta: REWARD_XP, points_delta: REWARD_POINTS, insight_delta: REWARD_INSIGHT }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.level != null && d?.xp != null) {
              const newPrivs = Array.isArray(d.privileges) ? d.privileges : [];
              const privKeys = newPrivs.map((p: { key: string; name?: string }) => p.key);
              setGrowth({
                level: d.level,
                xp: d.xp,
                points: d.points ?? 0,
                insight: d.insight ?? 0,
                privileges: privKeys,
              });
              if (d.level > prevLevel) {
                const added = newPrivs.filter((p: { key: string; name?: string }) => !prevPrivs.has(p.key));
                setLevelUpData({
                  level: d.level,
                  newPrivileges: added.map((p: { key: string; name?: string }) => ({ key: p.key, name: p.name ?? p.key })),
                });
                setShowLevelUpModal(true);
              }
            }
          })
          .catch(() => {});
      } else {
        const prevLevel = xpToLevel(localXp);
        const nextXp = localXp + REWARD_XP;
        const nextInsight = localInsight + REWARD_INSIGHT;
        setLocalXp(nextXp);
        setLocalInsight(nextInsight);
        const newLevel = xpToLevel(nextXp);
        if (newLevel > prevLevel) {
          setLevelUpData({ level: newLevel, newPrivileges: [] });
          setShowLevelUpModal(true);
        }
      }

      setTimeout(() => setShowResult(true), 400);
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= total) {
          if (nextIndex === 100) {
            setSoulMateTier(100);
            setPendingSoulMateNextIndex(100);
            setShowSoulMateLayer(true);
          } else {
            setShowFinalReport(true);
          }
        } else if (SOUL_MATE_TIERS.includes(nextIndex as (typeof SOUL_MATE_TIERS)[number])) {
          setSoulMateTier(nextIndex);
          setPendingSoulMateNextIndex(nextIndex);
          setShowSoulMateLayer(true);
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
      user?.id,
      growth?.level,
      growth?.privileges,
      localXp,
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

  const closeSoulMateLayer = useCallback(() => {
    setShowSoulMateLayer(false);
    const next = pendingSoulMateNextIndex;
    setPendingSoulMateNextIndex(null);
    fetchGrowth();
    if (next != null) {
      if (next >= total) {
        setShowFinalReport(true);
      } else {
        setCurrentIndex(next);
        setSelected(null);
        setShowResult(false);
        setLastChangedKeys([]);
      }
    }
  }, [pendingSoulMateNextIndex, total, fetchGrowth]);

  const restart = useCallback(() => {
    if (typeof window !== "undefined") try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) {}
    impactHistoryRef.current = [];
    prevTopAttrRef.current = null;
    resonanceLastShownAtRef.current = -999;
    setShowFinalReport(false);
    setShowSoulMateLayer(false);
    setPendingSoulMateNextIndex(null);
    setQuestionOrder(shuffleOrder(questions.length));
    setCurrentIndex(0);
    setStats({ ...INIT_STATS });
    setStageStartStats({ ...INIT_STATS });
    setSelected(null);
    setShowResult(false);
    setLastChangedKeys([]);
    setLocalXp(0);
    setLocalInsight(0);
    setRewardToast(null);
    setLevelUpData(null);
    setShowLevelUpModal(false);
  }, []);

  if (questionOrder === null) {
    return (
      <>
        <div className="flex min-h-screen w-full items-center justify-center bg-black pb-[env(safe-area-inset-bottom)]">
          <div className="h-6 w-6 animate-pulse rounded-full border border-white/20" />
        </div>
        <AnimatePresence>
          {showIntro && (
            <IntroModal
              onClose={() => {
                setShowIntro(false);
                setShowNoEditHint(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNoEditHint && (
            <NoEditHint onClose={() => setShowNoEditHint(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (!currentQuestion) {
  return (
      <>
        <div className="min-h-screen w-full bg-black pb-[env(safe-area-inset-bottom)]" />
        <AnimatePresence>
          {showIntro && (
            <IntroModal
              onClose={() => {
                setShowIntro(false);
                setShowNoEditHint(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNoEditHint && (
            <NoEditHint onClose={() => setShowNoEditHint(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (showFinalReport) {
    const topAttr = getTopAttribute(stats);
    const meta = STAGE_TITLES[topAttr] ?? STAGE_TITLES["自我"];
    const recap = getSacrificeRecap(impactHistoryRef.current);
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:px-6">
          {soulId && (
            <span className="absolute bottom-6 left-4 font-mono text-[10px] opacity-30 md:left-6">
              {soulId}
            </span>
          )}
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            终极镜像
          </p>
          <h1 className="mt-4 font-serif text-xl tracking-wide text-white/95 text-balance md:text-2xl lg:text-3xl">
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/chat"
              className="min-h-[48px] rounded border border-white/30 px-6 py-3 text-sm text-white/90 transition hover:bg-white/10"
            >
              我的连接
            </a>
            <motion.button
              type="button"
              onClick={restart}
              className="min-h-[48px] min-w-[140px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15 md:min-w-[160px]"
              whileTap={{ scale: 0.98 }}
            >
              重启轮回
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {showIntro && (
            <IntroModal
              onClose={() => {
                setShowIntro(false);
                setShowNoEditHint(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNoEditHint && (
            <NoEditHint onClose={() => setShowNoEditHint(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <motion.main
        className="relative flex h-screen h-[100dvh] w-full flex-col overflow-hidden bg-black font-sans text-white select-none pt-[env(safe-area-inset-top)]"
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

      {/* 奖励 Toast：+XP +Insight，1.5s */}
      <AnimatePresence>
        {rewardToast && (
          <RewardToast xp={rewardToast.xp} points={rewardToast.points} insight={rewardToast.insight} />
        )}
      </AnimatePresence>

      {/* 情境区 */}
      <div className="absolute left-0 right-0 top-[10%] z-10 px-4 text-center pointer-events-none md:top-[16%] md:px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuestion.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-normal leading-relaxed tracking-[0.2em] text-white/95 md:text-sm"
          >
            {currentQuestion.question_title}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 抉择区：灵魂对峙，上下对称 */}
      <div className="relative flex flex-1 flex-col pt-10 min-h-0">
        <OptionCard
          side="A"
          label="「 宁願 」"
          text={currentQuestion.optionA_text}
          isActive={selected === "A"}
          isDimmed={selected === "B"}
          onSelect={() => handleSelect("A")}
          showResult={showResult}
          ratio={displayRatio[0]}
        />
        <OptionCard
          side="B"
          label="「 或是 」"
          text={currentQuestion.optionB_text}
          isActive={selected === "B"}
          isDimmed={selected === "A"}
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
            className={`absolute bottom-20 left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-4 text-center text-base italic text-white pointer-events-none md:bottom-24 md:px-6 ${
              resonanceWhisper.position === "topLeft"
                ? "md:text-left md:pl-12"
                : resonanceWhisper.position === "topRight"
                  ? "md:text-right md:pr-12"
                  : ""
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
            className="absolute bottom-20 left-4 right-4 z-5 w-full max-w-md px-4 text-center text-sm italic text-white pointer-events-none md:bottom-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-6"
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
      <footer className="flex shrink-0 justify-center gap-2 overflow-x-auto border-t border-zinc-900/80 bg-zinc-950/50 px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] scrollbar-hide md:gap-3 md:px-4">
        {STAT_KEYS.map((name) => (
          <StatBar
            key={name}
            name={name}
            value={stats[name]}
            highlight={lastChangedKeys.includes(name)}
          />
        ))}
      </footer>

      {/* 灵魂身份标本标签 + 退出 */}
      {soulId && (
        <span className="absolute bottom-14 left-3 z-10 font-mono text-[10px] opacity-30 md:bottom-16 md:left-4">
          {soulId}
        </span>
      )}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-3 md:right-4 md:top-4">
        {growth && user && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Lv.{growth.level}</span>
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-white/40"
                style={{
                  width: `${(() => {
                    const expAt = levelToExp(growth.level);
                    const expNext = levelToExp(growth.level + 1);
                    const need = expNext - expAt;
                    const have = growth.xp - expAt;
                    return need > 0 ? Math.min(100, (have / need) * 100) : 100;
                  })()}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-zinc-500">洞察 {growth.insight}</span>
          </div>
        )}
        {user ? (
          <>
            <a href="/profile" className="text-[10px] text-zinc-500 underline hover:text-white">
              个人主页
            </a>
            <a href="/chat" className="text-[10px] text-zinc-500 underline hover:text-white">
              我的连接
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] text-zinc-500 underline hover:text-white"
            >
              退出
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="text-[10px] text-zinc-500 underline hover:text-white"
          >
            登录
          </button>
        )}
      </div>

      {/* 灵魂伴侣层：每 20 题 */}
      <AnimatePresence>
        {showSoulMateLayer && (
          <SoulMateLayer
            tier={soulMateTier}
            matches={soulMateMatches}
            isLoggedIn={!!user}
            onContinue={closeSoulMateLayer}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      {/* 阶段性镜像 Modal */}
      <AnimatePresence>
        {showStageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:px-6"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              阶段性镜像
            </p>
            <h2 className="mt-4 font-serif text-xl tracking-wide text-white/95 text-balance md:text-2xl lg:text-3xl">
              {stageTitle}
            </h2>
            <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
              {stagePhrase}
            </p>
            {!user ? (
              <p className="mt-6 text-center text-xs text-zinc-500">
                登录后解锁真实灵魂伴侣
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="ml-2 underline text-white/70 hover:text-white"
                >
                  登录 | 注册
                </button>
              </p>
            ) : (
              <p className="mt-6 text-center text-xs text-zinc-500">
                <a href="/chat" className="underline text-white/70 hover:text-white">我的连接</a>
              </p>
            )}
            <motion.button
              type="button"
              onClick={closeStageModal}
              className="mt-10 min-h-[48px] min-w-[140px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15 md:min-w-[160px]"
              whileTap={{ scale: 0.98 }}
            >
              继续试炼
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 升级 Modal：新等级 + 新解锁权限 */}
      <AnimatePresence>
        {showLevelUpModal && levelUpData && (
          <LevelUpModal
            level={levelUpData.level}
            newPrivileges={levelUpData.newPrivileges}
            onClose={() => {
              setShowLevelUpModal(false);
              setLevelUpData(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.main>

      {/* 与你相似：桌面侧栏 + 移动端浮动按钮与抽屉 */}
      <div className="fixed right-0 top-0 bottom-0 z-20 hidden md:block">
        <motion.div
          className="flex h-full flex-col border-l border-white/10 bg-black/95"
          initial={false}
          animate={{ width: similarOpen ? 200 : 48 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            onClick={() => setSimilarOpen((o) => !o)}
            className="flex h-12 shrink-0 items-center justify-center border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white"
          >
            {similarOpen ? "收起" : "相似"}
          </button>
          {similarOpen && (
            <div className="flex flex-1 flex-col overflow-y-auto p-3">
              {!user ? (
                <p className="text-center text-xs text-zinc-500">
                  登录后解锁与你相似的人
                  <button type="button" onClick={() => setShowAuthModal(true)} className="mt-2 block w-full rounded border border-white/20 py-1.5 text-[10px] text-white/70 hover:bg-white/5">登录</button>
                </p>
              ) : !growth?.privileges?.includes("view_similar_souls") ? (
                <p className="text-center text-xs text-zinc-500">
                  Lv.2 解锁与你相似的人
                </p>
              ) : similarLoading ? (
                <p className="text-center text-xs text-zinc-500">加载中...</p>
              ) : similarMaxTier == null ? (
                <p className="text-center text-xs text-zinc-500">完成 20 题解锁</p>
              ) : similarMatches.length === 0 ? (
                <p className="text-center text-xs text-zinc-500">暂无匹配</p>
              ) : (
                <ul className="space-y-2">
                  {similarMatches.slice(0, 3).map((m) => (
                    <li key={m.soul_id} className="rounded border border-white/15 bg-white/5 p-2">
                      <span className="font-mono text-[10px] text-white/80">{m.soul_id}</span>
                      {m.resonance > 0 && <span className="ml-1 text-[10px] text-white/50">共鸣 {m.resonance}%</span>}
                      <button
                        type="button"
                        onClick={() => {
                          fetch("/api/conversations/request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ target_soul_id: m.soul_id }),
                          }).then(() => window.open("/chat", "_self"));
                        }}
                        className="mt-1.5 block w-full rounded border border-white/20 py-1 text-[10px] text-white/70 hover:bg-white/10"
                      >
                        请求连接
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 移动端：浮动按钮 */}
      {!similarOpen && (
        <button
          type="button"
          onClick={() => setSimilarOpen(true)}
          className="fixed bottom-20 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/90 text-[10px] text-zinc-400 md:hidden"
          aria-label="与你相似"
        >
          相似
        </button>
      )}

      {/* 移动端：抽屉 */}
      <AnimatePresence>
        {similarOpen && (
          <motion.div
            key="similar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSimilarOpen(false)}
          />
        )}
        {similarOpen && (
          <motion.div
            key="similar-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed right-0 top-0 bottom-0 z-40 w-72 border-l border-white/10 bg-black/95 p-4 md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-wider text-zinc-500">与你相似</span>
              <button type="button" onClick={() => setSimilarOpen(false)} className="text-zinc-500 hover:text-white">关闭</button>
            </div>
            <div className="mt-3">
              {!user ? (
                <p className="text-center text-xs text-zinc-500">
                  登录后解锁与你相似的人
                  <button type="button" onClick={() => { setShowAuthModal(true); setSimilarOpen(false); }} className="mt-2 block w-full rounded border border-white/20 py-2 text-[10px] text-white/70 hover:bg-white/5">登录</button>
                </p>
              ) : !growth?.privileges?.includes("view_similar_souls") ? (
                <p className="text-center text-xs text-zinc-500">Lv.2 解锁与你相似的人</p>
              ) : similarLoading ? (
                <p className="text-center text-xs text-zinc-500">加载中...</p>
              ) : similarMaxTier == null ? (
                <p className="text-center text-xs text-zinc-500">完成 20 题解锁</p>
              ) : similarMatches.length === 0 ? (
                <p className="text-center text-xs text-zinc-500">暂无匹配</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {similarMatches.slice(0, 3).map((m) => (
                    <li key={m.soul_id} className="rounded border border-white/15 bg-white/5 p-3">
                      <span className="font-mono text-[10px] text-white/80">{m.soul_id}</span>
                      {m.resonance > 0 && <span className="ml-1 text-[10px] text-white/50">共鸣 {m.resonance}%</span>}
                      <button
                        type="button"
                        onClick={() => {
                          fetch("/api/conversations/request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ target_soul_id: m.soul_id }),
                          }).then(() => window.open("/chat", "_self"));
                        }}
                        className="mt-2 block w-full rounded border border-white/20 py-2 text-[10px] text-white/70 hover:bg-white/10"
                      >
                        请求连接
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && (
          <IntroModal
            onClose={() => {
              setShowIntro(false);
              setShowNoEditHint(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showNoEditHint && (
          <NoEditHint onClose={() => setShowNoEditHint(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            soulId={soulId}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => { fetchUser(); setShowAuthModal(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function RewardToast({ xp, points, insight }: { xp: number; points: number; insight: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="fixed left-1/2 top-14 z-40 -translate-x-1/2 rounded border border-white/20 bg-zinc-900/95 px-4 py-2 text-center shadow-lg"
    >
      <span className="text-xs text-white/90">+{xp} XP</span>
      <span className="mx-2 text-zinc-600">·</span>
      <span className="text-xs text-white/90">+{points} 积分</span>
      <span className="mx-2 text-zinc-600">·</span>
      <span className="text-xs text-white/90">+{insight} 洞察</span>
    </motion.div>
  );
}

function LevelUpModal({
  level,
  newPrivileges,
  onClose,
}: {
  level: number;
  newPrivileges: { key: string; name: string }[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:px-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="flex flex-col items-center"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">升级</p>
        <h2 className="mt-4 font-serif text-xl tracking-wide text-white/95 md:text-2xl lg:text-3xl">
          Lv.{level}
        </h2>
        {newPrivileges.length > 0 && (
          <div className="mt-6 max-w-sm space-y-2 text-center">
            <p className="text-xs text-zinc-500">新解锁</p>
            <ul className="space-y-1 text-sm text-white/80">
              {newPrivileges.map((p) => (
                <li key={p.key}>{p.name}</li>
              ))}
            </ul>
          </div>
        )}
        <motion.button
          type="button"
          onClick={onClose}
          className="mt-10 min-h-[48px] min-w-[140px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15 md:min-w-[160px]"
          whileTap={{ scale: 0.98 }}
        >
          继续
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function SoulMateLayer({
  tier,
  matches,
  isLoggedIn,
  onContinue,
  onOpenAuth,
}: {
  tier: number;
  matches: { soul_id: string; resonance: number; stats?: Record<string, number> }[];
  isLoggedIn: boolean;
  onContinue: () => void;
  onOpenAuth?: () => void;
}) {
  const defaultStats = Object.fromEntries(STAT_KEYS.map((k) => [k, 50]));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:px-6"
    >
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-zinc-500">
        第 {tier / 20} 层灵魂伴侣
      </p>
      {!isLoggedIn && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          登录后解锁真实灵魂伴侣
          {onOpenAuth && (
            <button type="button" onClick={onOpenAuth} className="ml-2 underline text-white/70 hover:text-white">
              登录 | 注册
            </button>
          )}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-stretch justify-center gap-4 md:gap-6">
        {(matches.length ? matches : [{ soul_id: "—", resonance: 0 }, { soul_id: "—", resonance: 0 }, { soul_id: "—", resonance: 0 }]).slice(0, 3).map((m, i) => (
          <motion.div
            key={m.soul_id + i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex w-28 flex-col items-center rounded border border-white/15 bg-white/5 p-4 md:w-32"
          >
            <div className="h-16 w-16 overflow-hidden rounded opacity-80 md:h-20 md:w-20">
              <SoulRadar stats={m.stats ?? defaultStats} className="h-full w-full" />
            </div>
            <span className="mt-2 font-mono text-[10px] text-white/80">{m.soul_id}</span>
            {m.resonance > 0 && (
              <span className="mt-0.5 font-mono text-xs text-white/60">共鸣 {m.resonance}%</span>
            )}
            {m.soul_id !== "—" && (
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) onOpenAuth?.();
                  else {
                    fetch("/api/conversations/request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ target_soul_id: m.soul_id }),
                    }).then(() => window.open("/chat", "_self"));
                  }
                }}
                className="mt-2 rounded border border-white/20 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10"
              >
                请求连接
              </button>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {isLoggedIn && (
          <a
            href="/chat"
            className="min-h-[48px] rounded border border-white/30 px-6 py-3 text-sm text-white/90 transition hover:bg-white/10"
          >
            我的连接
          </a>
        )}
        <motion.button
          type="button"
          onClick={onContinue}
          className="min-h-[48px] min-w-[140px] rounded border border-white/30 bg-white/10 px-8 py-4 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15 md:min-w-[160px]"
          whileTap={{ scale: 0.98 }}
        >
          继续试炼
        </motion.button>
      </div>
    </motion.div>
  );
}

function AuthModal({
  soulId,
  onClose,
  onSuccess,
}: {
  soulId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (!justRegistered) return;
    const t = setTimeout(() => onSuccess(), 1800);
    return () => clearTimeout(t);
  }, [justRegistered, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            display_name: displayName.trim() || null,
            soul_id: soulId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "注册失败");
          setLoading(false);
          return;
        }
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError("账号已创建，请使用登录");
        else {
          setLoading(false);
          setJustRegistered(true);
        }
      } else {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        onSuccess();
      }
    } catch {
      setError("请求失败");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/85 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="w-full max-w-sm rounded border border-white/20 bg-zinc-900/95 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {justRegistered ? (
          <div className="flex flex-col items-center py-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl text-white/95" aria-hidden>
              ✓
            </span>
            <h3 className="mt-6 font-serif text-lg text-white/95">注册成功</h3>
            <p className="mt-2 text-center text-sm text-zinc-400">已为你登录，即将进入荒原</p>
            <motion.button
              type="button"
              onClick={onSuccess}
              className="mt-8 min-h-[48px] min-w-[140px] rounded border border-white/30 bg-white/10 px-8 py-3 text-sm uppercase tracking-widest text-white/90 transition hover:bg-white/15"
              whileTap={{ scale: 0.98 }}
            >
              进入荒原
            </motion.button>
          </div>
        ) : (
          <>
        <h3 className="font-serif text-lg text-white/95">匿名信号无法桥接。</h3>
        <p className="mt-2 text-sm text-zinc-400">为了触碰另一个灵魂，你必须先在荒原刻下真名。</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="代号/邮箱"
            className="w-full rounded border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full rounded border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500"
            required
            minLength={6}
          />
          {mode === "register" && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="显示名（可选）"
              className="w-full rounded border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500"
            />
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
              className="rounded border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            >
              {mode === "register" ? "去登录" : "去注册"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded border border-white/30 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 disabled:opacity-50"
            >
              {mode === "register" ? "建立连接" : "登录"}
            </button>
          </div>
        </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function NoEditHint({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-black/80 px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="max-w-sm rounded border border-white/20 bg-zinc-900/90 px-6 py-5 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          你的选择一旦做出，将无法更改。
        </p>
        <motion.button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-[44px] min-w-[120px] rounded border border-white/30 bg-white/10 px-6 py-2.5 text-sm text-white/90 transition hover:bg-white/15"
          whileTap={{ scale: 0.98 }}
        >
          知道了
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function IntroModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center tracking-[0.15em] md:gap-6 md:tracking-[0.2em]">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 md:text-base"
        >
          世界是一个天平。
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-sm text-gray-400 md:text-base"
        >
          左手是欲望，右手是灰烬。
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-sm text-gray-400 md:text-base"
        >
          你的灵魂本无形状，直到你说了那句「
          <strong className="text-white">我宁愿</strong>
          」
        </motion.p>
      </div>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4 }}
        onClick={onClose}
        className="absolute bottom-[max(6rem,calc(1.5rem+env(safe-area-inset-bottom)))] min-h-[48px] min-w-[200px] border border-white/30 bg-transparent px-8 py-4 tracking-[0.2em] text-white/80 transition hover:text-white md:tracking-[0.3em]"
      >
        开始折叠灵魂
      </motion.button>
    </motion.div>
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
  label: string;
  text: string;
  isActive: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  showResult: boolean;
  ratio: number;
};

function OptionCard({
  side,
  label,
  text,
  isActive,
  isDimmed,
  onSelect,
  showResult,
  ratio,
}: OptionCardProps) {
  const [hovered, setHovered] = useState(false);
  const contentOpacity = isDimmed ? 0.25 : 1;
  const contentScale = hovered && !isDimmed ? 1.02 : 1;
  const textColor = "text-white";

  const boxShadow =
    isDimmed
      ? "0 0 0 transparent"
      : isActive
        ? "0 0 28px rgba(255,255,255,0.06)"
        : hovered
          ? "0 0 20px rgba(255,255,255,0.03)"
          : "0 0 0 transparent";

  return (
    <motion.div
      onClick={onSelect}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative flex min-h-[120px] flex-1 cursor-pointer items-center justify-center px-4 touch-manipulation md:px-6 ${isActive ? "border border-white/20" : "border border-transparent"}`}
      animate={{ boxShadow }}
      transition={{ duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="flex max-w-[90vw] flex-col items-center gap-2 text-center md:max-w-lg"
        animate={{ opacity: contentOpacity }}
        transition={{ duration: 0.25 }}
      >
        <span className="mb-0.5 text-[10px] tracking-[0.4em] text-white/80">
          {label}
        </span>
        <motion.h2
          className={`font-extralight leading-relaxed tracking-widest text-lg ${textColor} md:text-xl`}
          animate={{ scale: contentScale }}
          transition={{ duration: 0.25 }}
        >
          {text}
        </motion.h2>
      </motion.div>
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
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex h-5 w-2.5 flex-col justify-end overflow-hidden rounded-sm bg-zinc-900 md:w-3">
        <motion.div
          className="w-full rounded-sm bg-white/35"
          initial={false}
          animate={{ height: `${value}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ minHeight: value > 0 ? 2 : 0 }}
        />
        </div>
      <span
        className={`text-[7px] tracking-wider transition-colors md:text-[8px] ${
          "text-white"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
