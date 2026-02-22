/** 9 维属性键，与答题页、雷达图一致 */
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

export const DEFAULT_STATS: Record<string, number> = Object.fromEntries(
  STAT_KEYS.map((k) => [k, 50])
);
