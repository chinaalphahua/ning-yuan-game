"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CosmeticItem = {
  key: string;
  name: string;
  slot: string;
  rarity: string;
  description: string;
  quantity?: number;
};

type MineData = {
  equipped: { hair: string | null; face: string | null; accessory: string | null };
  equipped_items: {
    hair: CosmeticItem | null;
    face: CosmeticItem | null;
    accessory: CosmeticItem | null;
  };
  inventory: (CosmeticItem & { quantity: number; first_obtained_at: string })[];
};

const RARITY_LABEL: Record<string, string> = {
  common: "普通",
  rare: "精良",
  epic: "史诗",
  legendary: "传说",
};
const SLOT_LABEL: Record<string, string> = {
  hair: "发型",
  face: "面部",
  accessory: "配饰",
};

export default function CosmeticsBlock() {
  const [data, setData] = useState<MineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"hair" | "face" | "accessory">("hair");
  const [equipping, setEquipping] = useState(false);

  const fetchMine = () => {
    setLoading(true);
    fetch("/api/cosmetics/mine")
      .then((r) => r.json())
      .then((d) => {
        if (d.inventory !== undefined) setData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const equip = (slot: "hair" | "face" | "accessory", cosmeticKey: string | null) => {
    setEquipping(true);
    fetch("/api/cosmetics/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, cosmetic_key: cosmeticKey }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) fetchMine();
      })
      .finally(() => setEquipping(false));
  };

  if (loading && !data) {
    return (
      <div className="rounded border border-white/[0.08] bg-white/[0.03] px-4 py-6">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  const hair = data?.equipped_items?.hair ?? null;
  const face = data?.equipped_items?.face ?? null;
  const acc = data?.equipped_items?.accessory ?? null;
  const bySlot = (data?.inventory ?? []).reduce(
    (acc, item) => {
      const s = item.slot as "hair" | "face" | "accessory";
      if (!acc[s]) acc[s] = [];
      acc[s].push(item);
      return acc;
    },
    {} as Record<string, CosmeticItem[]>
  );

  return (
    <div className="space-y-6">
      <div className="rounded border border-white/[0.08] bg-white/[0.03] px-4 py-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium tracking-wider text-zinc-400">头像装扮</h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[10px] tracking-wider text-white/70 underline underline-offset-2 transition hover:text-white/90"
          >
            更换装扮
          </button>
        </div>
        <div className="mt-4 space-y-3 text-left">
          <div>
            <p className="text-[10px] text-zinc-500">发型</p>
            <p className="mt-0.5 text-sm text-white/90">{hair?.name ?? "—"}</p>
            {hair?.description ? (
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{hair.description}</p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">面部</p>
            <p className="mt-0.5 text-sm text-white/90">{face?.name ?? "—"}</p>
            {face?.description ? (
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{face.description}</p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">配饰</p>
            <p className="mt-0.5 text-sm text-white/90">{acc?.name ?? "不装备"}</p>
            {acc?.description ? (
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{acc.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-lg border border-white/15 bg-zinc-900 p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">我的装扮</span>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-zinc-500 hover:text-white/80"
                >
                  ×
                </button>
              </div>
              <div className="mb-3 flex gap-2">
                {(["hair", "face", "accessory"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSlot(s)}
                    className={`rounded px-3 py-1.5 text-[10px] tracking-wider ${
                      activeSlot === s
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-zinc-500 hover:text-white/80"
                    }`}
                  >
                    {SLOT_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {activeSlot === "accessory" && (
                  <button
                    type="button"
                    onClick={() => {
                      equip("accessory", null);
                      setModalOpen(false);
                    }}
                    disabled={equipping}
                    className="w-full rounded border border-white/10 bg-white/5 py-2 text-left px-3 text-xs text-zinc-500 hover:bg-white/10 disabled:opacity-50"
                  >
                    不装备
                  </button>
                )}
                {(bySlot[activeSlot] ?? []).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      equip(activeSlot, item.key);
                    }}
                    disabled={equipping}
                    className="w-full rounded border border-white/10 bg-white/5 py-2 text-left px-3 text-xs text-white/90 hover:bg-white/10 disabled:opacity-50"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-[10px] text-zinc-500">
                      {RARITY_LABEL[item.rarity] ?? item.rarity}
                    </span>
                    {data?.equipped?.[activeSlot] === item.key ? (
                      <span className="ml-2 text-[10px] text-white/60">已装备</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
