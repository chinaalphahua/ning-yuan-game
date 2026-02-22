/** 权限 key → 跳转链接与展示文案（用于个人主页/成长进度页可点击权限） */
export const PRIVILEGE_LINKS: Record<string, { href: string; label: string }> = {
  view_soul_matches: { href: "/?open=soul_match", label: "查看灵魂匹配" },
  view_similar_souls: { href: "/?open=similar", label: "查看相似灵魂" },
};

export function getPrivilegeLink(key: string): { href: string; label: string } | null {
  return PRIVILEGE_LINKS[key] ?? null;
}
