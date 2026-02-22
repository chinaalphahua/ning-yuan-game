/** 每级解锁的权限（与 privileges 表 required_level 一致） */
export const PRIVILEGES_BY_LEVEL: Record<number, { key: string; name: string }[]> = {
  1: [{ key: "view_soul_matches", name: "查看灵魂匹配" }],
  2: [{ key: "view_similar_souls", name: "查看相似灵魂" }],
};
