"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ChatPage() {
  const [user, setUser] = useState<{ soul_id: string } | null | undefined>(undefined);
  const [joinGroupId, setJoinGroupId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => (d?.user ? setUser(d.user) : setUser(null)))
      .catch(() => setUser(null));
  }, []);

  const handleJoinGroup = () => {
    const id = joinGroupId.trim();
    if (!id) {
      setJoinError("请输入群 ID");
      return;
    }
    setJoinError("");
    setJoinSuccess(false);
    setJoinLoading(true);
    fetch(`/api/groups/${encodeURIComponent(id)}/join`, { method: "POST" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setJoinError((data?.error as string) ?? "加入失败");
          return;
        }
        setJoinSuccess(true);
        setJoinGroupId("");
        setTimeout(() => setJoinSuccess(false), 3000);
      })
      .catch(() => setJoinError("网络错误"))
      .finally(() => setJoinLoading(false));
  };

  if (user === undefined) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-zinc-400">加载中...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-zinc-400">请先登录以使用连接与群聊</p>
        <Link href="/" className="mt-4 text-sm text-white/80 underline hover:text-white">返回试炼</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-black text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          返回试炼
        </Link>
      </header>
      <main className="flex flex-1 flex-col p-4">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-white mb-3">加入群聊</h2>
          <p className="text-xs text-zinc-500 mb-3">输入群 ID（由群主或成员分享）即可加入</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinGroupId}
              onChange={(e) => { setJoinGroupId(e.target.value); setJoinError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
              placeholder="粘贴群 ID"
              className="flex-1 min-w-0 rounded-lg border border-white/20 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleJoinGroup}
              disabled={joinLoading || !joinGroupId.trim()}
              className="shrink-0 rounded-lg border border-white/30 px-4 py-2 text-sm text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-50"
            >
              {joinLoading ? "…" : "加入"}
            </button>
          </div>
          {joinError ? <p className="mt-2 text-xs text-red-400">{joinError}</p> : null}
          {joinSuccess ? <p className="mt-2 text-xs text-green-400">已加入群聊</p> : null}
        </section>
        <p className="mt-4 text-xs text-zinc-500">
          建群与群列表等功能可在此页继续扩展，或与原有聊天页合并。
        </p>
      </main>
    </div>
  );
}
