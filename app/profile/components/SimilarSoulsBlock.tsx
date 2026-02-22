"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Match = { soul_id: string; resonance: number; stats?: Record<string, number> };

interface SimilarSoulsBlockProps {
  hasPrivilege: boolean;
}

export default function SimilarSoulsBlock({ hasPrivilege }: SimilarSoulsBlockProps) {
  const [maxTier, setMaxTier] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasPrivilege) return;
    setLoading(true);
    fetch("/api/play/me")
      .then((r) => r.json())
      .then((d) => {
        const tier = d?.maxTier ?? null;
        setMaxTier(tier);
        if (tier != null) {
          return fetch(`/api/soul-mates?tier=${tier}`).then((res) => res.json());
        }
        setMatches([]);
      })
      .then((d) => {
        if (d?.matches) setMatches(d.matches);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [hasPrivilege]);

  if (!hasPrivilege) {
    return (
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">与我相似的人</p>
        <p className="text-sm text-zinc-600">Lv.2 解锁</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">与我相似的人</p>
      {loading ? (
        <p className="text-sm text-zinc-600">加载中...</p>
      ) : maxTier == null ? (
        <p className="text-sm text-zinc-600">完成 20 题解锁</p>
      ) : matches.length === 0 ? (
        <p className="text-sm text-zinc-600">暂无匹配</p>
      ) : (
        <>
          <ul className="space-y-3">
            {matches.slice(0, 3).map((m) => (
              <li
                key={m.soul_id}
                className="rounded border border-white/15 bg-white/5 p-3"
              >
                <span className="font-mono text-[10px] text-white/80">{m.soul_id}</span>
                {m.resonance > 0 && (
                  <span className="ml-1 text-[10px] text-white/50">共鸣 {m.resonance}%</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    fetch("/api/conversations/request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ target_soul_id: m.soul_id }),
                    }).then(() => {
                      window.location.href = "/chat";
                    });
                  }}
                  className="mt-2 block w-full rounded border border-white/20 py-2 text-[10px] text-white/70 transition hover:bg-white/10"
                >
                  请求连接
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center">
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
