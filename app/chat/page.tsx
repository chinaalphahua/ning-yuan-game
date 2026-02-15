"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Conversation = { id: string; other_soul_id: string; status: string; created_at: string };
type Message = { id: string; sender_soul_id: string; is_me: boolean; content: string; created_at: string };

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ soul_id: string } | null>(null);

  const fetchUser = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => (d?.user ? setUser(d.user) : setUser(null)))
      .catch(() => setUser(null));
  }, []);

  const fetchConversations = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
    fetchConversations();
  }, [fetchUser, fetchConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    fetch(`/api/messages?conversation_id=${selectedId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => setMessages([]));

    const t = setInterval(() => {
      fetch(`/api/messages?conversation_id=${selectedId}`)
        .then((r) => r.json())
        .then((d) => setMessages(d.messages ?? []));
    }, 3000);
    return () => clearInterval(t);
  }, [selectedId]);

  const acceptConnection = (conversationId: string) => {
    fetch("/api/conversations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId }),
    }).then(() => fetchConversations());
  };

  const sendMessage = () => {
    if (!selectedId || !input.trim()) return;
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: selectedId, content: input.trim() }),
    })
      .then((r) => r.json())
      .then(() => {
        setInput("");
        fetch(`/api/messages?conversation_id=${selectedId}`)
          .then((r) => r.json())
          .then((d) => setMessages(d.messages ?? []));
      });
  };

  const handleLogout = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }, []);

  const selected = conversations.find((c) => c.id === selectedId);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
        <p className="font-serif text-zinc-400">请先登录以查看连接。</p>
        <Link
          href="/"
          className="mt-4 border border-white/30 px-6 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          返回试炼
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <Link href="/" className="text-xs text-white/60 transition hover:text-white/90">
          返回试炼
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] opacity-50">{user.soul_id}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] text-zinc-500 underline hover:text-white"
          >
            退出
          </button>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-48 shrink-0 border-r border-zinc-800 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-zinc-500">加载中...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-xs text-zinc-500">暂无连接</p>
          ) : (
            <ul className="p-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded px-3 py-2 text-left text-sm ${
                      selectedId === c.id ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-mono">{c.other_soul_id}</span>
                    <span className="ml-1 text-[10px] text-zinc-500">{c.status === "accepted" ? "已连接" : "待接受"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main className="flex flex-1 flex-col min-h-0">
          {selected ? (
            <>
              <div className="shrink-0 border-b border-zinc-800 px-4 py-2 font-mono text-sm text-white/90">
                {selected.other_soul_id}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={m.is_me ? "text-right" : "text-left"}
                    >
                      <span className="inline-block max-w-[85%] rounded bg-white/10 px-3 py-2 text-sm">
                        {m.content}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-zinc-500">{m.sender_soul_id}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {selected.status === "accepted" && (
                <div className="shrink-0 flex gap-2 border-t border-zinc-800 p-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 rounded border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="rounded border border-white/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    发送
                  </button>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="shrink-0 flex flex-col items-center gap-2 p-3">
                  <p className="text-xs text-zinc-500">等待对方接受连接，或你可接受对方请求</p>
                  <button
                    type="button"
                    onClick={() => acceptConnection(selected.id)}
                    className="rounded border border-white/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    接受连接
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
              选择左侧会话或完成试炼后请求连接
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
