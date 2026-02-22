/** 升级公式：升到 level 所需累积 exp = (level-1)² × LEVEL_COEFFICIENT */
export const LEVEL_COEFFICIENT = 50;

/** 完成一题奖励 */
export const REWARD_EXP_QUESTION = 5;
export const REWARD_POINTS_QUESTION = 10;
export const REWARD_INSIGHT_QUESTION = 1;

/** 到达 tier checkpoint 奖励 */
export const REWARD_EXP_CHECKPOINT = 20;
export const REWARD_POINTS_CHECKPOINT = 30;
export const REWARD_INSIGHT_CHECKPOINT = 2;

/** 兼容旧逻辑（部分模块仍引用） */
export const XP_PER_LEVEL = 100;
