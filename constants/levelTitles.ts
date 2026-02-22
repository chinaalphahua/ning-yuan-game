/** 等级 → 称号映射 */
export const LEVEL_TITLES: Record<number, string> = {
  1: "初探者",
  2: "行者",
  3: "觉悟者",
  4: "守心人",
  5: "拾荒者",
  6: "观星者",
  7: "归途人",
  8: "独行者",
  9: "镜中人",
  10: "荒原主",
};

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? `Lv.${level}`;
}
