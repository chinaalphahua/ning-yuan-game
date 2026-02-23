/**
 * 答题掉落：按品质权重抽一件装扮并发放给用户。
 * 品质权重：普通 60%、精良 25%、史诗 12%、传说 3%。
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const RARITY_WEIGHTS: { rarity: "common" | "rare" | "epic" | "legendary"; weight: number }[] = [
  { rarity: "common", weight: 60 },
  { rarity: "rare", weight: 25 },
  { rarity: "epic", weight: 12 },
  { rarity: "legendary", weight: 3 },
];

function pickRarity(): "common" | "rare" | "epic" | "legendary" {
  const r = Math.random() * 100;
  let acc = 0;
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    acc += weight;
    if (r < acc) return rarity;
  }
  return "common";
}

export type DroppedCosmetic = {
  key: string;
  name: string;
  description: string;
  rarity: string;
};

/**
 * 执行一次开箱：随机品质 → 该品质内等概率一件 → 写入 user_cosmetics，返回掉落结果。
 */
export async function grantRandomCosmetic(
  admin: SupabaseClient,
  userId: string
): Promise<DroppedCosmetic | null> {
  const rarity = pickRarity();

  const { data: pool, error: poolErr } = await admin
    .from("avatar_cosmetics")
    .select("key, name, description, rarity")
    .eq("rarity", rarity);
  if (poolErr || !pool?.length) return null;

  const item = pool[Math.floor(Math.random() * pool.length)] as (typeof pool)[0];
  if (!item) return null;

  const { data: existing } = await admin
    .from("user_cosmetics")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("cosmetic_key", item.key)
    .maybeSingle();

  if (existing) {
    await admin
      .from("user_cosmetics")
      .update({ quantity: (existing.quantity as number) + 1 })
      .eq("user_id", userId)
      .eq("cosmetic_key", item.key);
  } else {
    await admin.from("user_cosmetics").insert({
      user_id: userId,
      cosmetic_key: item.key,
      quantity: 1,
    });
  }

  return {
    key: item.key,
    name: item.name,
    description: item.description ?? "",
    rarity: item.rarity,
  };
}
