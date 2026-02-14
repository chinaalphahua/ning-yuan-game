/**
 * 灵魂感应文案库 - 当某属性成为主导时的诗意低语
 */
export const RESONANCE_WHISPERS: Record<string, string> = {
  智慧: "你正变得透明。看清一切的代价，是失去形状。",
  自由: "风没有地址。你终于自由了，也终于无处可逃。",
  金钱: "金子是冷的。你正忙着给自己的灵魂镀上寒霜。",
  自我: "万物皆是回声。在这场试炼里，你只听得见自己。",
  情感: "你在废墟中索求余温。那些爱，终究是过期的药。",
  健康: "你在拒绝起跑。为了守住余生，你杀死了所有的可能。",
  家庭: "血缘是沉重的锚。你守住了岸，却错过了整片海洋。",
  权力: "你在废墟上建立神殿。落成那天，你发现里面只有你。",
  外貌: "镜子记住了你的脸，却漏掉了你的灵魂。你是美的，也是空的。",
};

export const RESONANCE_POSITIONS = [
  "topLeft",
  "topRight",
  "bottom",
] as const;

export type ResonancePosition = (typeof RESONANCE_POSITIONS)[number];
