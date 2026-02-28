"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => setConversations([]))
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
    setGroupsLoading(true);
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]))
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

  const ConversationList = () => (
    <>
      {loading ? (
        <p className="p-4 text-xs text-white/50">加载中...</p>
      ) : conversations.length === 0 ? (
        <p className="p-4 text-xs text-white/50">暂无连接</p>
      ) : (
        <ul className="p-2 space-y-0.5 md:p-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => selectConversation(c.id)}
                className={`w-full rounded-lg px-4 py-3 text-left min-h-[52px] touch-manipulation ${
                  selectedId === c.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 active:bg-white/10"
                }`}
              >
                <span className="text-sm font-medium">{c.other_display_name || c.other_soul_id}</span>
                {c.other_display_name ? <span className="ml-1 font-mono text-[10px] text-white/50">({c.other_soul_id})</span> : null}
                <span className="ml-2 text-[10px] text-white/50">{c.status === "accepted" ? "已连接" : "待接受"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const GroupList = () => (
    <>
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
        <span className="text-xs text-white/50">群聊</span>
        <button type="button" onClick={() => { setCreateGroupOpen(true); setCreateGroupError(""); }} className="text-xs text-white/80 hover:text-white touch-manipulation">创建群聊</button>
      </div>
      <div className="shrink-0 p-2 border-b border-white/[0.08]">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={joinGroupId}
            onChange={(e) => { setJoinGroupId(e.target.value); setJoinGroupError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
            placeholder="输入群 ID 加入"
            className="flex-1 min-w-0 rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/50 focus:outline-none"
          />
          <button type="button" onClick={handleJoinGroup} disabled={joinGroupLoading || !joinGroupId.trim()} className="shrink-0 rounded-lg border border-white/30 px-2 py-1.5 text-[10px] text-white/90 bg-white/10 disabled:opacity-50 touch-manipulation">加入</button>
        </div>
        {joinGroupError ? <p className="mt-1 text-[10px] text-red-400">{joinGroupError}</p> : null}
        {joinGroupSuccess ? <p className="mt-1 text-[10px] text-green-400">已加入</p> : null}
      </div>
      {groupsLoading ? (
        <p className="p-4 text-xs text-white/50">加载中...</p>
      ) : groups.length === 0 ? (
        <p className="p-4 text-xs text-white/50">暂无群聊</p>
      ) : (
        <ul className="p-2 space-y-0.5">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => selectGroup(g.id)}
                className={`w-full rounded-lg px-4 py-3 text-left min-h-[52px] touch-manipulation ${selectedGroupId === g.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 active:bg-white/10"}`}
              >
                <span className="text-sm font-medium">{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
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
            <button type="button" onClick={() => { setSelectedId(null); setSelectedGroupId(null); }} className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 active:bg-white/15 md:hidden" aria-label="返回会话列表">
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <Link href="/" className="text-sm text-white/60 transition hover:text-white/90 whitespace-nowrap">返回试炼</Link>
          {selected ? <span className="ml-2 truncate text-sm text-white/90 md:ml-0">{selected.other_display_name || selected.other_soul_id}</span> : null}
          {selectedGroup ? <span className="ml-2 truncate text-sm text-white/90 md:ml-0">{selectedGroup.name}</span> : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline font-mono text-[10px] opacity-50">{user.soul_id}</span>
          <button type="button" onClick={handleLogout} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-500 underline hover:text-white touch-manipulation">退出</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="glass-panel hidden md:block w-48 shrink-0 border-r border-white/[0.06] overflow-y-auto min-h-0 flex flex-col">
          <SoulLettersSection />
          <AddFriendSection />
          <ChatModeTabs />
          {chatMode === "dm" ? <ConversationList /> : <GroupList />}
        </aside>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-[52px] z-10 bg-[#08080f]/80 md:hidden" onClick={() => setDrawerOpen(false)} aria-hidden />
              <motion.aside
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
                className="fixed right-0 top-[52px] bottom-0 z-20 w-[85%] max-w-[320px] border-l border-white/[0.08] overflow-y-auto bg-[#08080f] md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <SoulLettersSection />
                <AddFriendSection />
                <ChatModeTabs />
                <div className="p-2 border-b border-white/[0.08] text-xs text-white/50">切换会话</div>
                {chatMode === "dm" ? <ConversationList /> : <GroupList />}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {selected ? (
            <>
              <div className="md:hidden shrink-0 border-b border-white/[0.08] px-4 py-2 min-h-[44px] flex items-center">
                <button type="button" onClick={() => setDrawerOpen(true)} className="text-sm font-medium text-white/90 touch-manipulation">{(selected.other_display_name || selected.other_soul_id)} ▾</button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden p-4 space-y-4 overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
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
              <div className="md:hidden shrink-0 border-b border-white/[0.08] px-4 py-2 min-h-[44px] flex items-center">
                <button type="button" onClick={() => setDrawerOpen(true)} className="text-sm font-medium text-white/90 touch-manipulation">{selectedGroup.name} ▾</button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden p-4 space-y-4 overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
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
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden md:hidden overscroll-contain [-webkit-overflow-scrolling:touch]">
                <AddFriendSection />
                <ChatModeTabs />
                {chatMode === "dm" ? <ConversationList /> : <GroupList />}
              </div>
              <div className="hidden md:flex flex-1 min-h-0 items-center justify-center px-4 text-center">
                <p className="text-sm text-white/50">选择左侧会话或群聊，或创建群聊</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {createGroupOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xl" onClick={() => !createGroupSubmitting && setCreateGroupOpen(false)} aria-hidden />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-lg fixed left-1/2 top-1/2 z-40 w-[90%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-medium text-white mb-3">创建群聊</h3>
              <input type="text" value={createGroupName} onChange={(e) => setCreateGroupName(e.target.value)} placeholder="群名称" className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:outline-none mb-4" maxLength={50} />
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
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => !createGroupSubmitting && (setCreateGroupOpen(false), setCreateGroupError(""))} className="px-4 py-2 text-xs text-white/50 hover:text-white touch-manipulation">取消</button>
                <button type="button" onClick={createGroup} disabled={createGroupSubmitting} className="rounded-lg border border-white/30 px-4 py-2 text-xs text-white/90 bg-white/10 hover:bg-white/15 disabled:opacity-50 touch-manipulation">{createGroupSubmitting ? "创建中…" : "创建"}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
