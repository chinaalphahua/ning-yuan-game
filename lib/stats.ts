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

/** Map similarity [0,1] to resonance percentage [85, 99] (legacy) */
export function toResonancePercent(similarity: number): number {
  return Math.round(85 + similarity * 14);
}

/**
 * 标准正态分布逆 CDF（分位数函数）近似，用于正态化展示
 * @param p 累计概率 (0, 1)
 */
function normInv(p: number): number {
  const pClamped = Math.max(1e-10, Math.min(1 - 1e-10, p));
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
  const b = [-8.4735109309, 23.08336743743, -21.06224101826, 3.13082909833];
  const c = [
    0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863,
    0.0038405729373609, 0.0003951896511919, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187,
  ];
  let y = pClamped - 0.5;
  if (Math.abs(y) < 0.425) {
    const y2 = y * y;
    return (y * (a[0] + y2 * (a[1] + y2 * (a[2] + y2 * a[3])))) / (1 + y2 * (b[0] + y2 * (b[1] + y2 * (b[2] + y2 * b[3]))));
  }
  const x = Math.sqrt(-2 * Math.log(y > 0 ? 1 - pClamped : pClamped));
  const z = c[0] + x * (c[1] + x * (c[2] + x * (c[3] + x * (c[4] + x * (c[5] + x * (c[6] + x * (c[7] + x * c[8])))))));
  return (y > 0 ? 1 : -1) * z;
}

/**
 * 按同层排名计算展示用共鸣%（统计分布，正式 0–100%）
 * 百分位 = (N - rank + 1) / N * 100，直接作为展示值，不做人为上限。
 * @param rank1Based 排名 1-based（第 1 名 = 1），并列时建议传入平均排名
 * @param totalCount 同层总人数 N
 */
export function resonancePercentFromRank(rank1Based: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const percentile = (totalCount - rank1Based + 1) / totalCount * 100;
  return Math.max(0, Math.min(100, Math.round(percentile)));
}

/**
 * 在百分位基础上做正态化展示变换：百分位 → z = Φ^{-1}(p/100) → 线性映射 z∈[-3,3] → [0,100]
 * 适用于希望展示值更贴近正态分布的场景（中间集中、两端拉开）。
 * @param rank1Based 排名 1-based，建议并列时使用平均排名
 * @param totalCount 同层总人数 N
 */
export function resonancePercentFromRankNormalized(rank1Based: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const percentile = (totalCount - rank1Based + 1) / totalCount * 100;
  const p = Math.max(0.0001, Math.min(0.9999, percentile / 100));
  const z = normInv(p);
  const display = 50 + (50 / 3) * z;
  return Math.max(0, Math.min(100, Math.round(display)));
}

/**
 * 按并列计算平均排名（mid-rank），用于百分位时更严谨
 * @param values 已按相似度降序排列的数组，同分连续
 * @returns 每个位置对应的 1-based 平均排名
 */
export function midRanksFromSortedDesc(values: number[]): number[] {
  const n = values.length;
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && values[j + 1] === values[i]) j++;
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) ranks[k] = avgRank;
    i = j + 1;
  }
  return ranks;
}
