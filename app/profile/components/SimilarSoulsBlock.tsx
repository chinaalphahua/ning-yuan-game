"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SoulRadar from "@/app/components/SoulRadar";
import { DEFAULT_STATS } from "@/constants/statKeys";

type HistoryMatch = {
  soul_id: string;
  display_name: string | null;
  resonance: number;
  stats?: Record<string, number>;
};

type HistoryEntry = {
  tier: number;
  created_at: string;
  matches: HistoryMatch[];
};

interface SimilarSoulsBlockProps {
  hasPrivilege: boolean;
}

function formatTierDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  } catch {
    return "";
  }
}

export default function SimilarSoulsBlock({ hasPrivilege }: SimilarSoulsBlockProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [activeSoul, setActiveSoul] = useState<{ soulId: string; tier: number } | null>(null);
  const [letterContent, setLetterContent] = useState("");
  const [letterSending, setLetterSending] = useState(false);
  const [letterSuccess, setLetterSuccess] = useState("");
  const [letterError, setLetterError] = useState("");

  useEffect(() => {
    if (!hasPrivilege) return;
    setLoading(true);
    fetch("/api/soul-mates/history")
      .then((r) => r.json())
      .then((d) => setHistory(d?.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [hasPrivilege]);

  if (!hasPrivilege) {
    return (
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">灵魂匹配 / 相似灵魂历史</p>
        <p className="text-sm text-zinc-600">Lv.2 解锁</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">灵魂匹配 / 相似灵魂历史</p>
      {loading ? (
        <p className="text-sm text-zinc-600">加载中...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-zinc-600">完成 20 题后此处会显示各层匹配记录</p>
      ) : (
        <>
          {requestError ? <p className="mb-2 text-[10px] text-red-400">{requestError}</p> : null}
          <div className="space-y-8">
            {history.map((entry) => (
              <div key={entry.tier}>
                <p className="mb-2 text-xs text-zinc-500">
                  第 {entry.tier / 20} 层 · 完成 {entry.tier} 题
                  {entry.created_at ? (
                    <span className="ml-2 text-zinc-600">{formatTierDate(entry.created_at)}</span>
                  ) : null}
                </p>
                <ul className="space-y-3">
                  {entry.matches.map((m) => (
                    <li
                      key={`${entry.tier}-${m.soul_id}`}
                      className="glass rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded opacity-90">
                          <SoulRadar stats={m.stats ?? DEFAULT_STATS} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white/90">
                            {m.display_name || m.soul_id}
                          </p>
                          {m.display_name ? (
                            <p className="font-mono text-[10px] text-zinc-500">{m.soul_id}</p>
                          ) : null}
                          {m.resonance > 0 && (
                            <p className="mt-0.5 text-[10px] text-white/50">共鸣 {m.resonance}%</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setRequestError("");
                              setLetterError("");
                              setLetterSuccess("");
                              setActiveSoul({ soulId: m.soul_id, tier: entry.tier });
                            }}
                            className="mt-2 rounded border border-white/20 py-1.5 px-2 text-[10px] text-white/70 transition hover:bg-white/10"
                          >
                            写一封笺言
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {activeSoul && (
            <div className="glass-md mt-6 max-w-md space-y-2 rounded-lg p-4 text-xs text-white/80">
              <p className="text-[10px] tracking-[0.25em] text-zinc-400">宁愿 · 人生笺言</p>
              <p className="mt-2 text-[11px] text-zinc-300">
                你可以选择宁愿向 <span className="font-mono text-white">{activeSoul.soulId}</span> 发出一封人生笺言，
                也可以在黑夜中保持安静。
              </p>
              <textarea
                rows={3}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                className="mt-2 w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                placeholder="写下一句此刻最想对 TA 说的话（最多 500 字）"
              />
              {letterError ? <p className="text-[10px] text-red-400">{letterError}</p> : null}
              {letterSuccess ? <p className="text-[10px] text-green-400">{letterSuccess}</p> : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSoul(null);
                    setLetterContent("");
                    setLetterError("");
                    setLetterSuccess("");
                  }}
                  className="rounded border border-white/20 px-3 py-1.5 text-[10px] text-zinc-400 hover:bg-white/10"
                >
                  在黑夜中保持安静
                </button>
                <button
                  type="button"
                  disabled={letterSending || !letterContent.trim()}
                  onClick={() => {
                    if (!activeSoul) return;
                    setLetterSending(true);
                    setLetterError("");
                    setLetterSuccess("");
                    fetch("/api/soul-letters", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        target_soul_id: activeSoul.soulId,
                        content: letterContent,
                        tier: activeSoul.tier,
                      }),
                    })
                      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
                      .then(({ ok, data }) => {
                        if (!ok) {
                          setLetterError((data?.error as string) ?? "发送失败");
                          return;
                        }
                        setLetterSuccess("笺言已悄悄寄出。只有当 TA 认同时，你们才会成为连接。");
                        setLetterContent("");
                      })
                      .catch(() => setLetterError("发送失败，请稍后再试"))
                      .finally(() => setLetterSending(false));
                  }}
                  className="rounded border border-white/30 bg-white/10 px-4 py-1.5 text-[10px] text-white/90 hover:bg-white/15 disabled:opacity-40"
                >
                  {letterSending ? "发送中..." : "发出笺言"}
                </button>
              </div>
            </div>
          )}
          <p className="mt-4 text-center">
            <Link
              href="/?open=similar"
              className="text-[10px] text-zinc-500 underline transition hover:text-white/70"
            >
              在答题页打开侧栏
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
