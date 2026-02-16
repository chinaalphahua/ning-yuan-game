"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

type Conversation = { id: string; other_soul_id: string; other_display_name?: string | null; status: string; created_at: string };
type Message = { id: string; sender_soul_id: string; is_me: boolean; content: string; created_at: string };

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ soul_id: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(false);
  };

  const ConversationList = () => (
    <>
      {loading ? (
        <p className="p-4 text-xs text-zinc-500">加载中...</p>
      ) : conversations.length === 0 ? (
        <p className="p-4 text-xs text-zinc-500">暂无连接</p>
      ) : (
        <ul className="p-2 space-y-0.5 md:p-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => selectConversation(c.id)}
                className={`w-full rounded-lg px-4 py-3 text-left min-h-[52px] touch-manipulation ${
                  selectedId === c.id ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 active:bg-white/10"
                }`}
              >
                <span className="text-sm font-medium">{c.other_display_name || c.other_soul_id}</span>
                {c.other_display_name ? <span className="ml-1 font-mono text-[10px] text-zinc-500">({c.other_soul_id})</span> : null}
                <span className="ml-2 text-[10px] text-zinc-500">{c.status === "accepted" ? "已连接" : "待接受"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-black text-white pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),4.5rem)] md:pb-[env(safe-area-inset-bottom)]">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3 min-h-[48px] touch-manipulation">
        <div className="flex items-center gap-2 min-w-0">
          {selectedId ? (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 active:bg-white/15 md:hidden"
              aria-label="返回会话列表"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <Link href="/" className="text-sm text-white/60 transition hover:text-white/90 whitespace-nowrap">
            返回试炼
          </Link>
          {selected ? (
            <span className="ml-2 truncate text-sm text-white/90 md:ml-0">{selected.other_display_name || selected.other_soul_id}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline font-mono text-[10px] opacity-50">{user.soul_id}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-500 underline hover:text-white touch-manipulation"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 桌面：左侧会话列表 */}
        <aside className="hidden md:block w-48 shrink-0 border-r border-zinc-800 overflow-y-auto">
          <ConversationList />
        </aside>

        {/* 移动端：切换会话时抽屉 */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 top-[52px] z-10 bg-black/60 md:hidden"
                onClick={() => setDrawerOpen(false)}
                aria-hidden
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed right-0 top-[52px] bottom-0 z-20 w-[85%] max-w-[320px] border-l border-zinc-800 overflow-y-auto bg-black md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-zinc-800 text-xs text-zinc-500">切换会话</div>
                <ConversationList />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex flex-1 flex-col min-h-0">
          {selected ? (
            <>
              <div className="md:hidden shrink-0 border-b border-zinc-800 px-4 py-2 min-h-[44px] flex items-center">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="text-sm font-mono text-white/90 touch-manipulation"
                >
                  {(selected.other_display_name || selected.other_soul_id)} ▾
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 overscroll-contain">
                <AnimatePresence>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${m.is_me ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col max-w-[85%] ${m.is_me ? "items-end" : "items-start"}`}>
                        <span
                          className={`inline-block rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                            m.is_me ? "rounded-br-md bg-white/15 text-white" : "rounded-bl-md bg-white/8 text-zinc-100"
                          }`}
                        >
                          {m.content}
                        </span>
                        <span className="mt-1 font-mono text-[10px] text-zinc-500">{m.sender_soul_id}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {selected.status === "accepted" && (
                <div className="shrink-0 flex gap-2 border-t border-zinc-800 p-3 pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="输入消息..."
                    className="flex-1 min-h-[48px] rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-[16px] text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none touch-manipulation"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="shrink-0 min-h-[48px] min-w-[64px] flex items-center justify-center rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 active:bg-white/20 touch-manipulation"
                  >
                    发送
                  </button>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="shrink-0 flex flex-col items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <p className="text-xs text-zinc-500 text-center">等待对方接受连接，或你可接受对方请求</p>
                  <button
                    type="button"
                    onClick={() => acceptConnection(selected.id)}
                    className="min-h-[48px] min-w-[120px] rounded-xl border border-white/30 px-6 py-3 text-sm text-white/90 hover:bg-white/10 active:bg-white/15 touch-manipulation"
                  >
                    接受连接
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col min-h-0">
              {/* 移动端：无选中时主区域显示会话列表 */}
              <div className="flex-1 overflow-y-auto md:hidden">
                <ConversationList />
              </div>
              {/* 桌面：无选中时显示提示 */}
              <div className="hidden md:flex flex-1 items-center justify-center px-4 text-center">
                <p className="text-sm text-zinc-500">选择左侧会话或完成试炼后请求连接</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
