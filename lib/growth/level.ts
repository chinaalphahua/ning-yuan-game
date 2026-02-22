import { LEVEL_COEFFICIENT } from "./constants";

/** 根据累积 exp 计算当前等级（exp = (level-1)² × 系数） */
export function expToLevel(exp: number): number {
  if (exp < 0) return 1;
  let level = 1;
  while (levelToExp(level + 1) <= exp) level++;
  return level;
}

/** 升到某等级所需的最低累积 exp */
export function levelToExp(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) ** 2 * LEVEL_COEFFICIENT;
}

/** 兼容旧 API 名称 */
export const xpToLevel = expToLevel;
