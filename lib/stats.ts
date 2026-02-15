export const STAT_KEYS = [
  "金钱",
  "健康",
  "情感",
  "智慧",
  "权力",
  "外貌",
  "自我",
  "自由",
  "家庭",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export function statsToVector(stats: Record<string, number>): number[] {
  return STAT_KEYS.map((k) => stats[k] ?? 50);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Map similarity [0,1] to resonance percentage [85, 99] */
export function toResonancePercent(similarity: number): number {
  return Math.round(85 + similarity * 14);
}
