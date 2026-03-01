"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

type SearchHit = { soul_id: string; display_name: string | null };
type Conversation = { id: string; other_soul_id: string; other_display_name?: string | null; status: string; created_at: string };
type Message = { id: string; sender_soul_id: string; is_me: boolean; content: string; created_at: string };
type Group = { id: string; name: string; created_at: string };
type GroupMessage = { id: string; sender_soul_id: string; sender_display_name: string | null; is_me: boolean; content: string; created_at: string };
type SoulLetter = {
  id: string;
  tier: number;
  content: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender_soul_id: string;
  sender_display_name: string | null;
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsError, setConversationsError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ soul_id: string } | null | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addFriendId, setAddFriendId] = useState("");
  const [addFriendError, setAddFriendError] = useState("");
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendSearchResults, setAddFriendSearchResults] = useState<SearchHit[]>([]);
  const [addFriendSearchLoading, setAddFriendSearchLoading] = useState(false);
  const [addFriendSearchError, setAddFriendSearchError] = useState("");
  const addFriendSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chatMode, setChatMode] = useState<"dm" | "group">("dm");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsError, setGroupsError] = useState("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupSelectedIds, setCreateGroupSelectedIds] = useState<Set<string>>(new Set());
  const [createGroupSubmitting, setCreateGroupSubmitting] = useState(false);
  const [createGroupError, setCreateGroupError] = useState("");
  const [joinGroupId, setJoinGroupId] = useState("");
  const [joinGroupError, setJoinGroupError] = useState("");
  const [joinGroupSuccess, setJoinGroupSuccess] = useState(false);
  const [joinGroupLoading, setJoinGroupLoading] = useState(false);
  const [letters, setLetters] = useState<SoulLetter[]>([]);
  const [lettersLoading, setLettersLoading] = useState(false);
  const [lettersError, setLettersError] = useState("");

  const fetchUser = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => (d?.user ? setUser(d.user) : setUser(null)))
      .catch(() => setUser(null));
  }, []);

  const fetchConversations = useCallback(() => {
    setConversationsError("");
    setLoading(true);
    fetch("/api/conversations")
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setConversationsError("加载失败，请点击刷新");
          return;
        }
        setConversationsError("");
        setConversations(data?.conversations ?? []);
      })
      .catch(() => {
        setConversationsError("加载失败，请点击刷新");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchLetters = useCallback(() => {
    setLettersLoading(true);
    setLettersError("");
    fetch("/api/soul-letters/inbox")
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setLettersError((data?.error as string) ?? "加载失败");
          setLetters([]);
          return;
        }
        setLetters(data?.letters ?? []);
      })
      .catch(() => {
        setLettersError("加载失败，请稍后再试");
        setLetters([]);
      })
      .finally(() => setLettersLoading(false));
  }, []);

  const fetchGroups = useCallback(() => {
    setGroupsError("");
    setGroupsLoading(true);
    fetch("/api/groups")
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setGroupsError("加载失败，请点击刷新");
          return;
        }
        setGroupsError("");
        setGroups(data?.groups ?? []);
      })
      .catch(() => {
        setGroupsError("加载失败，请点击刷新");
      })
      .finally(() => setGroupsLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
    fetchConversations();
    fetchLetters();
  }, [fetchUser, fetchConversations, fetchLetters]);

  useEffect(() => {
    if (chatMode === "group") fetchGroups();
  }, [chatMode, fetchGroups]);

  useEffect(() => {
    const q = addFriendId.trim();
    if (!q) {
      setAddFriendSearchResults([]);
      setAddFriendSearchError("");
      return;
    }
    if (addFriendSearchTimerRef.current) clearTimeout(addFriendSearchTimerRef.current);
    addFriendSearchTimerRef.current = setTimeout(() => {
      addFriendSearchTimerRef.current = null;
      setAddFriendSearchLoading(true);
      setAddFriendSearchError("");
      fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
        .then(({ ok, data }) => {
          if (!ok) {
            setAddFriendSearchError((data?.error as string) ?? "搜索失败，请稍后再试");
            setAddFriendSearchResults([]);
            return;
          }
          setAddFriendSearchError("");
          setAddFriendSearchResults(data?.list ?? []);
        })
        .catch(() => {
          setAddFriendSearchError("搜索失败，请稍后再试");
          setAddFriendSearchResults([]);
        })
        .finally(() => setAddFriendSearchLoading(false));
    }, 300);
    return () => {
      if (addFriendSearchTimerRef.current) clearTimeout(addFriendSearchTimerRef.current);
    };
  }, [addFriendId]);

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

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupMessages([]);
      return;
    }
    fetch(`/api/groups/${selectedGroupId}/messages`)
      .then((r) => r.json())
      .then((d) => setGroupMessages(d.messages ?? []))
      .catch(() => setGroupMessages([]));
    const t = setInterval(() => {
      fetch(`/api/groups/${selectedGroupId}/messages`)
        .then((r) => r.json())
        .then((d) => setGroupMessages(d.messages ?? []));
    }, 3000);
    return () => clearInterval(t);
  }, [selectedGroupId]);

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

  const sendGroupMessage = () => {
    if (!selectedGroupId || !input.trim()) return;
    fetch(`/api/groups/${selectedGroupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    })
      .then((r) => r.json())
      .then(() => {
        setInput("");
        fetch(`/api/groups/${selectedGroupId}/messages`)
          .then((r) => r.json())
          .then((d) => setGroupMessages(d.messages ?? []));
      });
  };

  const handleLogout = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }, []);

  const normalizeSoulId = (raw: string): string => {
    const t = raw.trim();
    if (/^\d{4}$/.test(t)) return `NO.NY-${t}-X`;
    if (/^NO\.NY-\d{4}-[AX]$/i.test(t)) return t.toUpperCase().replace("no.ny-", "NO.NY-");
    return t;
  };

  const handleAddFriend = useCallback(() => {
    const raw = addFriendId.trim();
    if (!raw) {
      setAddFriendError("请输入灵魂 ID");
      return;
    }
    const target = normalizeSoulId(raw);
    if (user?.soul_id && target === user.soul_id) {
      setAddFriendError("不能添加自己");
      return;
    }
    setAddFriendError("");
    setAddFriendSuccess(false);
    setAddFriendLoading(true);
    fetch("/api/conversations/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_soul_id: target }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setAddFriendError((data?.error as string) ?? "请求失败");
          return;
        }
        setAddFriendId("");
        setAddFriendSuccess(true);
        fetchConversations();
        setTimeout(() => setAddFriendSuccess(false), 3000);
      })
      .catch(() => setAddFriendError("网络错误"))
      .finally(() => setAddFriendLoading(false));
  }, [addFriendId, user?.soul_id, fetchConversations]);

  const createGroup = () => {
    const name = createGroupName.trim() || "未命名群聊";
    const member_soul_ids = conversations
      .filter((c) => c.status === "accepted" && createGroupSelectedIds.has(c.id))
      .map((c) => c.other_soul_id);
    setCreateGroupError("");
    setCreateGroupSubmitting(true);
    fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, member_soul_ids }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          setCreateGroupError((data?.error as string) ?? "创建失败");
          setCreateGroupSubmitting(false);
          return;
        }
        setCreateGroupOpen(false);
        setCreateGroupName("");
        setCreateGroupSelectedIds(new Set());
        setCreateGroupError("");
        setCreateGroupSubmitting(false);
        setChatMode("group");
        fetchGroups();
        setSelectedGroupId(data.group_id);
        setSelectedId(null);
      })
      .catch(() => { setCreateGroupError("网络错误"); setCreateGroupSubmitting(false); });
  };

  const handleJoinGroup = () => {
    const id = joinGroupId.trim();
    if (!id) {
      setJoinGroupError("请输入群 ID");
      return;
    }
    setJoinGroupError("");
    setJoinGroupSuccess(false);
    setJoinGroupLoading(true);
    fetch(`/api/groups/${encodeURIComponent(id)}/join`, { method: "POST" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setJoinGroupError((data?.error as string) ?? "加入失败");
          return;
        }
        setJoinGroupSuccess(true);
        setJoinGroupId("");
        fetchGroups();
        setTimeout(() => setJoinGroupSuccess(false), 3000);
      })
      .catch(() => setJoinGroupError("网络错误"))
      .finally(() => setJoinGroupLoading(false));
  };

  const respondLetter = (letterId: string, action: "accept" | "reject" | "report") => {
    fetch("/api/soul-letters/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter_id: letterId, action }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setLettersError((data?.error as string) ?? "操作失败");
          return;
        }
        setLetters((prev) =>
          prev.map((l) => (l.id === letterId ? { ...l, status: data.status ?? action, responded_at: new Date().toISOString() } : l)),
        );
        if (action === "accept") {
          fetchConversations();
        }
      })
      .catch(() => setLettersError("操作失败，请稍后再试"));
  };

  const selected = conversations.find((c) => c.id === selectedId);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-[#08080f] text-white p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <p className="text-white/60">加载中...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-[#08080f] text-white p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <p className="text-white/60">请先登录以查看连接。</p>
        <Link href="/" className="mt-4 rounded-xl border border-white/30 px-6 py-3 text-sm text-white/80 transition hover:bg-white/10">返回试炼</Link>
      </div>
    );
  }

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setSelectedGroupId(null);
    setDrawerOpen(false);
  };

  const selectGroup = (id: string) => {
    setSelectedGroupId(id);
    setSelectedId(null);
    setDrawerOpen(false);
  };

  const SoulLettersSection = () => (
    <div className="shrink-0 border-b border-zinc-800 p-3 space-y-2">
      <p className="text-[10px] text-zinc-500">宁愿 · 收到的人生笺言</p>
      {lettersLoading ? (
        <p className="text-[10px] text-zinc-500">加载中...</p>
      ) : letters.length === 0 ? (
        <p className="text-[10px] text-zinc-500">暂无笺言</p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {letters.map((l) => (
            <li key={l.id} className="glass rounded-lg p-2 text-[11px] text-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{l.sender_display_name || l.sender_soul_id}</span>
                  {l.sender_display_name ? (
                    <span className="ml-1 font-mono text-[10px] text-zinc-500">{l.sender_soul_id}</span>
                  ) : null}
                </div>
                <span className="ml-2 text-[10px] text-zinc-500">第 {l.tier / 20} 层</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-200 whitespace-pre-wrap break-words">{l.content}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {l.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => respondLetter(l.id, "accept")}
                      className="rounded border border-white/25 bg-white/10 px-2 py-1 text-[10px] text-white/90 hover:bg-white/20 touch-manipulation"
                    >
                      认同笺言
                    </button>
                    <button
                      type="button"
                      onClick={() => respondLetter(l.id, "reject")}
                      className="rounded border border-white/15 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/10 touch-manipulation"
                    >
                      不认同
                    </button>
                    <button
                      type="button"
                      onClick={() => respondLetter(l.id, "report")}
                      className="rounded border border-red-400/60 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10 touch-manipulation"
                    >
                      举报
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-400">
                    {l.status === "accepted" ? "你认同了这封笺言 · 你们已可以在连接中对话" : null}
                    {l.status === "rejected" ? "你选择了不认同这封笺言" : null}
                    {l.status === "reported" ? "已举报，此连接不会建立" : null}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {lettersError ? <p className="text-[10px] text-red-400">{lettersError}</p> : null}
    </div>
  );

  const AddFriendSection = () => (
    <div className="shrink-0 border-b border-zinc-800 p-3">
      <p className="text-[10px] text-zinc-500 mb-2">搜 ID 加好友</p>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={addFriendId}
          onChange={(e) => { setAddFriendId(e.target.value); setAddFriendError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
          placeholder="输入灵魂 ID 或昵称，如 NO.NY-7612-X"
          className="glass flex-1 min-w-0 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20"
          maxLength={20}
        />
        <button
          type="button"
          onClick={handleAddFriend}
          disabled={addFriendLoading || !addFriendId.trim()}
          className="shrink-0 rounded-lg border border-white/30 px-3 py-2 text-[10px] text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-50 touch-manipulation"
        >
          {addFriendLoading ? "…" : "请求连接"}
        </button>
      </div>
      {addFriendSearchLoading ? <p className="mt-1.5 text-[10px] text-zinc-500">搜索中...</p> : null}
      {!addFriendSearchLoading && addFriendSearchError ? <p className="mt-1.5 text-[10px] text-red-400">{addFriendSearchError}</p> : null}
      {!addFriendSearchLoading && !addFriendSearchError && addFriendId.trim() && addFriendSearchResults.length === 0 ? (
        <p className="mt-1.5 text-[10px] text-zinc-500">未找到匹配的灵魂 ID 或昵称</p>
      ) : null}
      {!addFriendSearchLoading && addFriendSearchResults.length > 0 ? (
        <ul className="glass-md mt-1.5 max-h-[160px] overflow-y-auto rounded-lg space-y-0.5 p-1">
          {addFriendSearchResults.map((hit) => (
            <li key={hit.soul_id}>
              <button
                type="button"
                onClick={() => { setAddFriendId(hit.soul_id); setAddFriendSearchResults([]); }}
                className="w-full text-left rounded-md px-3 py-2 text-xs text-white/90 hover:bg-white/10 active:bg-white/15 touch-manipulation"
              >
                <span className="font-medium">{hit.display_name || hit.soul_id}</span>
                {hit.display_name ? <span className="ml-1.5 font-mono text-[10px] text-zinc-500">{hit.soul_id}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {addFriendError ? <p className="mt-1.5 text-[10px] text-red-400">{addFriendError}</p> : null}
      {addFriendSuccess ? <p className="mt-1.5 text-[10px] text-green-400">已发送请求</p> : null}
    </div>
  );

  const ConversationList = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex flex-col">
      {loading ? (
        <p className={`${compact ? "p-2 text-xs" : "p-4 text-sm"} text-white/60`}>加载中...</p>
      ) : conversationsError ? (
        <div className={`${compact ? "p-2" : "p-4"} space-y-2`}>
          <p className={`${compact ? "text-xs" : "text-sm"} text-amber-300`}>{conversationsError}</p>
          <button type="button" onClick={() => fetchConversations()} className="rounded-lg border border-white/30 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 touch-manipulation">刷新</button>
        </div>
      ) : conversations.length === 0 ? (
        <p className={`${compact ? "p-2 text-xs" : "p-4 text-sm"} text-white/50`}>暂无连接，搜 ID 加好友</p>
      ) : (
        <ul className={compact ? "py-1" : "py-2 space-y-0.5"}>
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left touch-manipulation transition-colors ${compact
                  ? `px-3 py-2 text-xs ${selectedId === c.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/8"}`
                  : `rounded-xl px-4 py-3.5 ${selectedId === c.id ? "bg-white/10 text-white ring-1 ring-white/20" : "text-white/80 hover:bg-white/[0.06]"}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`${compact ? "w-6 h-6 text-[10px]" : "w-9 h-9 text-sm"} rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-medium text-white/80 shrink-0`}>
                    {(c.other_display_name || c.other_soul_id).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`${compact ? "text-xs" : "text-sm"} font-medium truncate`}>{c.other_display_name || c.other_soul_id}</span>
                      {c.status === "pending" && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                    {!compact && c.other_display_name ? <p className="font-mono text-[10px] text-white/40 truncate">{c.other_soul_id}</p> : null}
                  </div>
                  {!compact && <span className={`shrink-0 text-[10px] ${c.status === "accepted" ? "text-white/40" : "text-amber-400"}`}>{c.status === "accepted" ? "已连接" : "待接受"}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const GroupList = () => (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
        <span className="text-xs text-white/40">群聊</span>
        <button type="button" onClick={() => { setCreateGroupOpen(true); setCreateGroupError(""); }} className="text-xs text-white/60 hover:text-white touch-manipulation">+ 创建</button>
      </div>
      <div className="px-3 py-2 border-b border-white/[0.08]">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={joinGroupId}
            onChange={(e) => { setJoinGroupId(e.target.value); setJoinGroupError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
            placeholder="群 ID"
            className="flex-1 min-w-0 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/25"
          />
          <button type="button" onClick={handleJoinGroup} disabled={joinGroupLoading || !joinGroupId.trim()} className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] text-white/80 hover:bg-white/10 disabled:opacity-40 touch-manipulation">加入</button>
        </div>
        {joinGroupError ? <p className="mt-1 text-[10px] text-red-400">{joinGroupError}</p> : null}
        {joinGroupSuccess ? <p className="mt-1 text-[10px] text-green-400">已加入</p> : null}
      </div>
      {groupsLoading ? (
        <p className="p-3 text-xs text-white/50">加载中...</p>
      ) : groupsError ? (
        <div className="p-3 space-y-2">
          <p className="text-xs text-amber-300">{groupsError}</p>
          <button type="button" onClick={() => fetchGroups()} className="rounded-lg border border-white/30 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 touch-manipulation">刷新</button>
        </div>
      ) : groups.length === 0 ? (
        <p className="p-3 text-xs text-white/50">暂无群聊</p>
      ) : (
        <ul className="py-1">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => selectGroup(g.id)}
                className={`w-full px-3 py-2.5 text-left touch-manipulation transition-colors ${selectedGroupId === g.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/[0.06]"}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 text-[10px] rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-medium text-white/80 shrink-0">
                    {g.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium truncate">{g.name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const ChatModeTabs = () => (
    <div className="shrink-0 flex border-b border-white/[0.08]">
      <button type="button" onClick={() => { setChatMode("dm"); setSelectedGroupId(null); }} className={`flex-1 py-2.5 text-xs touch-manipulation ${chatMode === "dm" ? "text-white border-b-2 border-white" : "text-white/50"}`}>单聊</button>
      <button type="button" onClick={() => { setChatMode("group"); setSelectedId(null); }} className={`flex-1 py-2.5 text-xs touch-manipulation ${chatMode === "group" ? "text-white border-b-2 border-white" : "text-white/50"}`}>群聊</button>
    </div>
  );

  return (
    <div className="relative flex h-screen h-[100dvh] flex-col bg-[#08080f] text-white pt-[env(safe-area-inset-top)] overflow-hidden">
      <div className="glass-bg" aria-hidden />
      <header className="relative z-10 glass-panel flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 min-h-[48px] touch-manipulation">
        <div className="flex items-center gap-2 min-w-0">
          {selectedId || selectedGroupId ? (
            <button type="button" onClick={() => { setSelectedId(null); setSelectedGroupId(null); }} className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 active:bg-white/15 sm:hidden" aria-label="返回会话列表">
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <Link href="/" className="text-sm text-white/60 transition hover:text-white/90 whitespace-nowrap">返回试炼</Link>
          {selected ? <span className="ml-2 truncate text-sm text-white/90 md:ml-0">{selected.other_display_name || selected.other_soul_id}</span> : null}
          {selectedGroup ? <span className="ml-2 truncate text-sm text-white/90 md:ml-0">{selectedGroup.name}</span> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] text-white/40">{user.soul_id}</span>
          <button type="button" onClick={handleLogout} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-white/40 hover:text-white touch-manipulation">退出</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="glass-panel hidden sm:flex w-52 shrink-0 flex-col border-r border-white/[0.06] overflow-y-auto overflow-x-hidden min-h-0">
          <SoulLettersSection />
          <AddFriendSection />
          <ChatModeTabs />
          {chatMode === "dm" ? <ConversationList compact /> : <GroupList />}
        </aside>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-[52px] z-10 bg-[#08080f]/80 sm:hidden" onClick={() => setDrawerOpen(false)} aria-hidden />
              <motion.aside
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
                className="fixed right-0 top-[52px] bottom-0 z-20 w-[85%] max-w-[320px] border-l border-white/[0.08] overflow-y-auto bg-[#08080f] sm:hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <SoulLettersSection />
                <AddFriendSection />
                <ChatModeTabs />
                {chatMode === "dm" ? <ConversationList compact /> : <GroupList />}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="relative flex-1 min-w-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selected ? (
            <>
              <div className="shrink-0 border-b border-white/[0.08] px-4 py-2 min-h-[44px] flex items-center justify-between">
                <button type="button" onClick={() => setDrawerOpen(true)} className="text-sm font-medium text-white/90 touch-manipulation sm:cursor-default">
                  <span>{selected.other_display_name || selected.other_soul_id}</span>
                  {selected.other_display_name ? <span className="ml-1.5 font-mono text-[10px] text-white/40">{selected.other_soul_id}</span> : null}
                  <span className="sm:hidden ml-1">▾</span>
                </button>
                <span className={`text-[10px] ${selected.status === "accepted" ? "text-green-400/60" : "text-amber-400/60"}`}>{selected.status === "accepted" ? "已连接" : "待接受"}</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 overscroll-contain" style={{ minHeight: 120, WebkitOverflowScrolling: 'touch' }}>
                <AnimatePresence>
                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${m.is_me ? "justify-end" : "justify-start"}`}>
                      <div className={`flex flex-col max-w-[85%] ${m.is_me ? "items-end" : "items-start"}`}>
                        <span className={`inline-block rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${m.is_me ? "rounded-br-md glass-md text-white" : "rounded-bl-md glass text-zinc-100"}`}>{m.content}</span>
                        <span className="mt-1 font-mono text-[10px] text-zinc-500">{m.sender_soul_id}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {selected.status === "accepted" && (
                <div className="glass-panel shrink-0 flex gap-2 border-t border-white/[0.06] p-3 pb-[max(3rem,env(safe-area-inset-bottom))] md:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder="输入消息..." className="glass flex-1 min-w-0 min-h-[48px] max-h-[48px] rounded-xl px-4 py-3 text-[16px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 touch-manipulation" autoComplete="off" maxLength={500} />
                  <button type="button" onClick={sendMessage} className="shrink-0 min-h-[48px] min-w-[64px] flex items-center justify-center rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 active:bg-white/20 touch-manipulation">发送</button>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="shrink-0 flex flex-col items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <p className="text-xs text-zinc-500 text-center">等待对方接受连接，或你可接受对方请求</p>
                  <button type="button" onClick={() => acceptConnection(selected.id)} className="min-h-[48px] min-w-[120px] rounded-xl border border-white/30 px-6 py-3 text-sm text-white/90 hover:bg-white/10 active:bg-white/15 touch-manipulation">接受连接</button>
                </div>
              )}
            </>
          ) : selectedGroup ? (
            <>
              <div className="shrink-0 border-b border-white/[0.08] px-4 py-2 min-h-[44px] flex items-center">
                <button type="button" onClick={() => setDrawerOpen(true)} className="text-sm font-medium text-white/90 touch-manipulation sm:cursor-default">
                  <span>{selectedGroup.name}</span>
                  <span className="sm:hidden ml-1">▾</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 overscroll-contain" style={{ minHeight: 120, WebkitOverflowScrolling: 'touch' }}>
                <AnimatePresence>
                  {groupMessages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${m.is_me ? "justify-end" : "justify-start"}`}>
                      <div className={`flex flex-col max-w-[85%] ${m.is_me ? "items-end" : "items-start"}`}>
                        <span className={`inline-block rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${m.is_me ? "rounded-br-md glass-md text-white" : "rounded-bl-md glass text-zinc-100"}`}>{m.content}</span>
                        <span className="mt-1 font-mono text-[10px] text-zinc-500">{m.sender_display_name || m.sender_soul_id}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="glass-panel shrink-0 flex gap-2 border-t border-white/[0.06] p-3 pb-[max(3rem,env(safe-area-inset-bottom))] md:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendGroupMessage())} placeholder="输入消息..." className="glass flex-1 min-w-0 min-h-[48px] max-h-[48px] rounded-xl px-4 py-3 text-[16px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 touch-manipulation" autoComplete="off" maxLength={500} />
                <button type="button" onClick={sendGroupMessage} className="shrink-0 min-h-[48px] min-w-[64px] flex items-center justify-center rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 active:bg-white/20 touch-manipulation">发送</button>
              </div>
            </>
          ) : (
            <div style={{ flex: '1 1 0%', overflowY: 'auto', overflowX: 'hidden' }}>
              {/* 桌面端：侧边栏已有列表，主区域显示欢迎 */}
              <div className="hidden sm:flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.03] flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-60">💬</span>
                </div>
                <p className="text-sm text-white/50">从左侧选择一个会话开始聊天</p>
                <p className="mt-1 text-xs text-white/30">或搜索灵魂 ID 添加新好友</p>
              </div>
              {/* 移动端：显示完整列表 */}
              <div className="sm:hidden px-4 py-4">
                <h2 className="pb-3 text-base font-semibold text-white">连接</h2>
                <AddFriendSection />
                <ChatModeTabs />
                <div className="mt-3">
                  {chatMode === "dm" ? <ConversationList /> : <GroupList />}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {createGroupOpen && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <div
            key="create-group-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !createGroupSubmitting && setCreateGroupOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-group-title"
              className="glass-lg relative z-10 w-full max-w-[360px] max-h-[85vh] min-h-[200px] flex flex-col rounded-2xl overflow-hidden"
              style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex flex-col min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <h3 id="create-group-title" className="text-sm font-medium text-white mb-3">创建群聊</h3>
            <input
              type="text"
              value={createGroupName}
              onChange={(e) => setCreateGroupName(e.target.value)}
              placeholder="群名称"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:outline-none mb-4"
              maxLength={50}
              autoFocus
            />
            <p className="text-[10px] text-white/50 mb-2">选择已连接的好友加入群聊（可选）</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1 mb-4">
              {conversations.filter((c) => c.status === "accepted").length === 0 ? (
                <p className="text-xs text-white/50 py-2">暂无已连接好友</p>
              ) : (
                conversations.filter((c) => c.status === "accepted").map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={createGroupSelectedIds.has(c.id)} onChange={() => setCreateGroupSelectedIds((prev) => { const next = new Set(prev); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })} className="rounded border-white/30" />
                    <span className="text-sm text-white/90">{c.other_display_name || c.other_soul_id}</span>
                  </label>
                ))
              )}
            </div>
            {createGroupError ? <p className="mb-3 text-xs text-red-400">{createGroupError}</p> : null}
            <div className="flex gap-2 justify-end shrink-0">
              <button type="button" onClick={() => !createGroupSubmitting && (setCreateGroupOpen(false), setCreateGroupError(""))} className="px-4 py-2 text-xs text-white/50 hover:text-white touch-manipulation">取消</button>
              <button type="button" onClick={createGroup} disabled={createGroupSubmitting} className="rounded-lg border border-white/30 px-4 py-2 text-xs text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-50 touch-manipulation">{createGroupSubmitting ? "创建中…" : "创建"}</button>
            </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
