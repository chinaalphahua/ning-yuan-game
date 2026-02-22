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
                      className="rounded border border-white/15 bg-white/5 p-3"
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
                              fetch("/api/conversations/request", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ target_soul_id: m.soul_id }),
                              })
                                .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
                                .then(({ ok, data }) => {
                                  if (!ok) {
                                    setRequestError((data?.error as string) ?? "请求失败");
                                    return;
                                  }
                                  setRequestError("");
                                  window.location.href = "/chat";
                                })
                                .catch(() => setRequestError("请求失败，请稍后再试"));
                            }}
                            className="mt-2 rounded border border-white/20 py-1.5 px-2 text-[10px] text-white/70 transition hover:bg-white/10"
                          >
                            请求连接
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
