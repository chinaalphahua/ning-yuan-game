import { XP_PER_LEVEL } from "./constants";

/** 根据累积 XP 计算当前等级 */
export function xpToLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

/** 升到某等级所需的最低累积 XP */
export function levelToXp(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * XP_PER_LEVEL;
}
