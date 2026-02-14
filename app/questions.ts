// 定义属性影响的类型
export type Impact = {
  金钱?: number;
  健康?: number;
  情感?: number;
  智慧?: number;
  权力?: number;
  外貌?: number;
  自我?: number;
  自由?: number;
  家庭?: number;
};

export type Question = {
  id: number;
  question_title: string;
  optionA_text: string;
  optionB_text: string;
  impactA: Impact;
  impactB: Impact;
};

// --- 宁愿：回归 9 维度 - 完整 100 题库 ---
export const questions: Question[] = [
  // ==========================================
  // 第一乐章：肉身与世俗的博弈 (1-25)
  // ==========================================
  {
    id: 1,
    question_title: "关于暴富的代价。",
    optionA_text: "立即获得 1000 万现金，但你的身高永远缩短 15 厘米。",
    optionB_text: "保持现状，继续为生活奔波。",
    impactA: { 金钱: 10, 外貌: -8, 自我: -4 },
    impactB: { 金钱: -2, 自由: -2, 自我: 4 }
  },
  {
    id: 2,
    question_title: "关于颜值的博弈。",
    optionA_text: "拥有全人类最完美的五官，但代价是你余生只能拥有 2 小时睡眠。",
    optionB_text: "相貌平平，但每天都能睡到自然醒。",
    impactA: { 外貌: 10, 健康: -8, 自由: -4 },
    impactB: { 健康: 8, 外貌: -2 }
  },
  {
    id: 3,
    question_title: "关于健康的交易。",
    optionA_text: "你的身体永远保持在 20 岁，代价是你无法拥有任何长期记忆。",
    optionB_text: "自然老去，带着满脑子的回忆步入坟墓。",
    impactA: { 健康: 10, 外貌: 8, 智慧: -10 },
    impactB: { 智慧: 8, 外貌: -6 }
  },
  {
    id: 4,
    question_title: "关于智力的剥夺。",
    optionA_text: "智商瞬间提升至 200，代价是你从此无法共情任何幽默和笑话。",
    optionB_text: "智力普通，但每天都能开怀大笑。",
    impactA: { 智慧: 10, 情感: -8, 自我: 4 },
    impactB: { 情感: 8, 智慧: -2 }
  },
  {
    id: 5,
    question_title: "关于家庭的祭坛。",
    optionA_text: "成为世界首富，代价是你所有的家人都会逐渐视你为仇敌。",
    optionB_text: "收入仅够糊口，但家庭氛围极度温馨。",
    impactA: { 金钱: 10, 权力: 8, 家庭: -10 },
    impactB: { 家庭: 10, 金钱: -6 }
  },
  {
    id: 6,
    question_title: "关于味觉的牺牲。",
    optionA_text: "这辈子吃任何东西都是顶级美味，代价是你永远感到饥饿。",
    optionB_text: "吃什么都味同嚼蜡，但身体永远饱腹且健康。",
    impactA: { 情感: 6, 健康: -8, 自由: -4 },
    impactB: { 健康: 8, 情感: -6 }
  },
  {
    id: 7,
    question_title: "关于声音的交换。",
    optionA_text: "拥有天籁般的歌喉，代价是你平时说话会变得极其刺耳难听。",
    optionB_text: "声音平庸，但在人群中说话很舒服。",
    impactA: { 外貌: 6, 权力: 4, 情感: -6 },
    impactB: { 情感: 6, 外貌: -2 }
  },
  {
    id: 8,
    question_title: "关于睡眠的异界。",
    optionA_text: "睡着后进入一个绝对快乐的清醒梦世界，代价是现实中你会变得极度嗜睡。",
    optionB_text: "清醒地活在现实，哪怕现实很无聊。",
    impactA: { 自由: 8, 情感: 6, 自我: -10 },
    impactB: { 自我: 8, 情感: -4 }
  },
  {
    id: 9,
    question_title: "关于幸运的守恒。",
    optionA_text: "这辈子买彩票必中，代价是你身边亲近的人会轮流倒霉。",
    optionB_text: "一生无横财，但身边人平安顺遂。",
    impactA: { 金钱: 10, 家庭: -10, 情感: -8 },
    impactB: { 家庭: 8, 金钱: -4 }
  },
  {
    id: 10,
    question_title: "关于性感的诅咒。",
    optionA_text: "拥有极致的性吸引力，代价是你永远无法获得纯粹的友谊。",
    optionB_text: "做一个路人甲，拥有真诚的朋友。",
    impactA: { 外貌: 10, 情感: -8 },
    impactB: { 情感: 8, 外貌: -4 }
  },
  {
    id: 11,
    question_title: "关于权力的牢笼。",
    optionA_text: "成为国家领袖，代价是你余生无法踏出办公室一步。",
    optionB_text: "做一个自由的流浪汉，没人知道你是谁。",
    impactA: { 权力: 10, 自由: -10, 自我: 4 },
    impactB: { 自由: 10, 权力: -10, 金钱: -6 }
  },
  {
    id: 12,
    question_title: "关于名声的孤独。",
    optionA_text: "获得诺贝尔奖并名垂青史，代价是你这辈子孤独一人。",
    optionB_text: "在小城平庸度日，子孙满堂。",
    impactA: { 智慧: 10, 权力: 6, 家庭: -10 },
    impactB: { 家庭: 10, 智慧: -6 }
  },
  {
    id: 13,
    question_title: "关于真相的重量。",
    optionA_text: "能看穿世间所有谎言，代价是没有任何人真的爱你。",
    optionB_text: "活在甜蜜的假象里，无知地被所有人虚伪地宠溺着。",
    impactA: { 智慧: 8, 情感: -10, 自我: 6 },
    impactB: { 情感: 8, 智慧: -8, 自我: -4 }
  },
  {
    id: 14,
    question_title: "关于感官的麻木。",
    optionA_text: "失去痛觉，从此不知肉体苦难，代价是你也失去了快感。",
    optionB_text: "保留所有敏感的神经，包括受伤时的剧痛。",
    impactA: { 健康: 6, 情感: -8, 自我: -4 },
    impactB: { 情感: 6, 健康: -2 }
  },
  {
    id: 15,
    question_title: "关于动物的低语。",
    optionA_text: "能听懂所有动物的语言，代价是你逐渐丧失人类语言的能力。",
    optionB_text: "留在人类社会，继续孤独地做万物之灵。",
    impactA: { 智慧: 6, 自由: 8, 情感: -10 },
    impactB: { 情感: 8, 自由: -4 }
  },
  {
    id: 16,
    question_title: "关于阅读的极速。",
    optionA_text: "一秒钟读完一本书并完全理解，代价是你无法通过阅读获得任何乐趣。",
    optionB_text: "慢慢啃书，享受每一个字的起伏。",
    impactA: { 智慧: 10, 情感: -6 },
    impactB: { 情感: 6, 智慧: -2 }
  },
  {
    id: 17,
    question_title: "关于预知梦。",
    optionA_text: "梦见第二天发生的所有倒霉事，代价是你无法改变它们。",
    optionB_text: "对未来一无所知，睡个好觉。",
    impactA: { 智慧: 6, 自由: -8, 健康: -4 },
    impactB: { 健康: 6, 自由: 4 }
  },
  {
    id: 18,
    question_title: "关于永不疲惫。",
    optionA_text: "肉体永远不需要休息，代价是你的精神时刻紧绷。",
    optionB_text: "会累会喘，但能享受瘫软在床上的松弛感。",
    impactA: { 健康: 8, 权力: 10, 情感: -6 },
    impactB: { 情感: 8, 权力: -6 }
  },
  {
    id: 19,
    question_title: "关于绝对理性。",
    optionA_text: "在任何危机时刻都能做出最优解，代价是你被朋友视为冷血机器。",
    optionB_text: "会因为冲动犯错，但有人情味。",
    impactA: { 智慧: 10, 情感: -8 },
    impactB: { 情感: 10, 智慧: -4 }
  },
  {
    id: 20,
    question_title: "关于记忆的准确。",
    optionA_text: "拥有照相机般的记忆力，代价是你忘不掉任何一次受辱的经历。",
    optionB_text: "健忘，但也因此容易快乐。",
    impactA: { 智慧: 8, 情感: -10 },
    impactB: { 情感: 8, 智慧: -4 }
  },
  {
    id: 21,
    question_title: "关于瞬间移动。",
    optionA_text: "可以瞬间抵达任何地点，代价是每次移动都会缩短 24 小时寿命。",
    optionB_text: "老老实实走路坐车，安稳活到老。",
    impactA: { 自由: 10, 健康: -6 },
    impactB: { 健康: 8, 自由: -4 }
  },
  {
    id: 22,
    question_title: "关于时间倒流。",
    optionA_text: "可以回到过去修改一个错误，代价是你会失去现在最珍贵的一件东西。",
    optionB_text: "落子无悔，接受残缺的现状。",
    impactA: { 智慧: 4, 自由: 6, 自我: -8 },
    impactB: { 自我: 6, 自由: -2 }
  },
  {
    id: 23,
    question_title: "关于读心术。",
    optionA_text: "能听见路人的每一个念头，代价是你无法控制这个声音，直到发疯。",
    optionB_text: "做一个清净的普通人，猜不透人心。",
    impactA: { 智慧: 8, 健康: -10, 自我: -6 },
    impactB: { 健康: 6, 智慧: -4 }
  },
  {
    id: 24,
    question_title: "关于偶像的光环。",
    optionA_text: "成为全球偶像，受万人追捧，代价是你永远不能在公共场合卸下浓妆。",
    optionB_text: "做一个邋遢的普通人，没人认识你，但你可以随时在路边摊吃面。",
    impactA: { 外貌: 10, 权力: 6, 自我: -8 },
    impactB: { 自由: 8, 外貌: -4, 权力: -4 }
  },
  {
    id: 25,
    question_title: "关于完美的伪善。",
    optionA_text: "每个人都认为你是道德圣人，代价是你必须每天在深夜做一件让你厌恶的恶事。",
    optionB_text: "被世人误解为恶棍，但你内心清白如水。",
    impactA: { 权力: 8, 情感: 4, 自我: -10 },
    impactB: { 自我: 10, 权力: -8, 情感: -6 }
  },

  // ==========================================
  // 第二乐章：情感与关系的枷锁 (26-50)
  // ==========================================
  {
    id: 26,
    question_title: "关于透明的人生。",
    optionA_text: "你的智商提高 50 点，代价是你每天的私生活都会被直播给全世界看。",
    optionB_text: "保持现在的智商，拥有绝对的隐私。",
    impactA: { 智慧: 10, 自由: -10, 自我: -6 },
    impactB: { 自由: 10, 智慧: -2 }
  },
  {
    id: 27,
    question_title: "关于艺术的诅咒。",
    optionA_text: "你能创作出传世名画，代价是你这辈子无法感受到任何色彩，只能看到黑白。",
    optionB_text: "画不出画，但能看清世间绚烂的颜色。",
    impactA: { 智慧: 8, 自我: 6, 健康: -4 },
    impactB: { 健康: 6, 智慧: -6 }
  },
  {
    id: 28,
    question_title: "关于被爱的幻觉。",
    optionA_text: "无论你做什么，这世界上都有一个人无条件地爱你，但他永远不会出现在你面前。",
    optionB_text: "身边充满了具体的人，但他们对你的爱都是有条件的。",
    impactA: { 情感: 8, 自由: 6, 自我: -6 },
    impactB: { 自我: 8, 情感: -4 }
  },
  {
    id: 29,
    question_title: "关于仇恨的消除。",
    optionA_text: "你可以让你最恨的人立刻消失，代价是你也会立刻遗忘你最爱的人。",
    optionB_text: "忍受仇人在世，但记得爱人的脸。",
    impactA: { 权力: 10, 情感: -10 },
    impactB: { 情感: 10, 权力: -6 }
  },
  {
    id: 30,
    question_title: "关于交换命运。",
    optionA_text: "和世界首富交换人生，代价是你的家人不再认识你。",
    optionB_text: "守着你那破旧的躯壳和熟悉的关系网。",
    impactA: { 金钱: 10, 权力: 8, 家庭: -10 },
    impactB: { 家庭: 8, 自我: 4, 金钱: -8 }
  },
  {
    id: 31,
    question_title: "关于谎言的雷达。",
    optionA_text: "伴侣对你撒谎时你会立刻知道，代价是你们永远无法维持超过 3 年的关系。",
    optionB_text: "在半真半假中糊涂地过一辈子。",
    impactA: { 智慧: 8, 家庭: -10 },
    impactB: { 家庭: 8, 智慧: -6 }
  },
  {
    id: 32,
    question_title: "关于孩子的未来。",
    optionA_text: "你的孩子会成为改变世界的伟人，代价是他一辈子都不会回家看你。",
    optionB_text: "孩子平庸无奇，但常伴你左右。",
    impactA: { 权力: 6, 家庭: -10 },
    impactB: { 家庭: 10, 权力: -4 }
  },
  {
    id: 33,
    question_title: "关于前任的记忆。",
    optionA_text: "彻底删除所有关于前任的痛苦记忆，代价是你也失去了爱人的能力。",
    optionB_text: "带着旧伤口，继续寻找下一个可能伤害你的人。",
    impactA: { 健康: 6, 情感: -10 },
    impactB: { 情感: 8, 健康: -4 }
  },
  {
    id: 34,
    question_title: "关于唯一的听众。",
    optionA_text: "全世界都听不懂你的话，除了你的灵魂伴侣。",
    optionB_text: "全世界都懂你，但你找不到那个灵魂伴侣。",
    impactA: { 情感: 10, 权力: -8 },
    impactB: { 情感: -8, 自由: 8 }
  },
  {
    id: 35,
    question_title: "关于秘密的交换。",
    optionA_text: "知道所有朋友的秘密，代价是你不能告诉任何人。",
    optionB_text: "对此一无所知，像个傻瓜一样快乐。",
    impactA: { 智慧: 6, 健康: -8 },
    impactB: { 健康: 8, 智慧: -4 }
  },
  {
    id: 36,
    question_title: "关于永恒的美梦。",
    optionA_text: "在虚拟世界中当上帝，代价是你的肉体在现实中只是一具插管的躯壳。",
    optionB_text: "在残酷的现实中挣扎度日。",
    impactA: { 情感: 10, 自由: 10, 健康: -10 },
    impactB: { 自我: 8, 健康: 4, 情感: -6 }
  },
  {
    id: 37,
    question_title: "关于点赞的虚荣。",
    optionA_text: "你在网上发的每条动态都有百万点赞，代价是你现实中没有一个可以说话的朋友。",
    optionB_text: "发动态没人理，但现实中有三两个损友。",
    impactA: { 权力: 6, 外貌: 4, 情感: -10 },
    impactB: { 情感: 10, 权力: -6 }
  },
  {
    id: 38,
    question_title: "关于游戏的变现。",
    optionA_text: "把游戏金币 1:1 兑换成人民币，代价是每兑换 1 万，就会忘掉一个好友的名字。",
    optionB_text: "游戏只是游戏，朋友永远是朋友。",
    impactA: { 金钱: 10, 情感: -8, 智慧: -4 },
    impactB: { 情感: 8, 金钱: -4 }
  },
  {
    id: 39,
    question_title: "关于信息的茧房。",
    optionA_text: "只看到你想看到的新闻，永远不生气。",
    optionB_text: "被迫看到世界的真相，每天都在愤怒。",
    impactA: { 情感: 6, 智慧: -10 },
    impactB: { 智慧: 10, 情感: -8 }
  },
  {
    id: 40,
    question_title: "关于匿名后的恶。",
    optionA_text: "在网络上拥有绝对的匿名权，无论说什么都不负责。",
    optionB_text: "实名上网，为你说的每一个字负责。",
    impactA: { 自由: 10, 自我: -10 },
    impactB: { 自我: 10, 自由: -6 }
  },
  {
    id: 41,
    question_title: "关于被理解的代价。",
    optionA_text: "所有人都能瞬间理解你的痛苦，代价是你将承受所有人的痛苦。",
    optionB_text: "孤独地消化痛苦，也无需背负他人的重担。",
    impactA: { 情感: 10, 健康: -10 },
    impactB: { 健康: 8, 情感: -6 }
  },
  {
    id: 42,
    question_title: "关于完美的父母。",
    optionA_text: "给你的孩子植入芯片，让他永远不会叛逆。",
    optionB_text: "忍受他的叛逆、离家出走和对你的伤害。",
    impactA: { 权力: 8, 家庭: -6, 自由: -10 },
    impactB: { 家庭: 6, 自由: 8, 情感: -4 }
  },
  {
    id: 43,
    question_title: "关于永不失恋。",
    optionA_text: "服用一种药物，从此切断“心碎”这种情绪。",
    optionB_text: "保留心碎的能力，痛并爱着。",
    impactA: { 健康: 8, 情感: -10 },
    impactB: { 情感: 10, 健康: -4 }
  },
  {
    id: 44,
    question_title: "关于绝对的公平。",
    optionA_text: "世界变得绝对公平，代价是没有人再有特权保护你。",
    optionB_text: "世界不公，但你是受益的那一方。",
    impactA: { 自我: 10, 金钱: -6 },
    impactB: { 金钱: 8, 自我: -8 }
  },
  {
    id: 45,
    question_title: "关于隐私的贩卖。",
    optionA_text: "出售你一年的隐私数据，换取一辈子花不完的钱。",
    optionB_text: "守着隐私，精打细算过日子。",
    impactA: { 金钱: 10, 自由: -10, 自我: -8 },
    impactB: { 自由: 8, 金钱: -6 }
  },
  {
    id: 46,
    question_title: "关于极致的伴侣。",
    optionA_text: "拥有一个完美听话、永不衰老的机器人伴侣，代价是你从此对人类失去兴趣。",
    optionB_text: "在充满争吵和衰老的人间寻找真爱。",
    impactA: { 外貌: 6, 情感: 4, 自我: -8 },
    impactB: { 情感: 10, 智慧: 4, 外貌: -4 }
  },
  {
    id: 47,
    question_title: "关于重来的机会。",
    optionA_text: "回到 18 岁重活一次，代价是你现在的孩子会从世界上彻底消失。",
    optionB_text: "接受苍老和遗憾，守护现在的家人。",
    impactA: { 自由: 10, 健康: 10, 家庭: -10 },
    impactB: { 家庭: 10, 情感: 6, 自由: -6 }
  },
  {
    id: 48,
    question_title: "关于魅力的代价。",
    optionA_text: "所有人见到你第一眼都会爱上你，代价是你永远听不到任何人的真话。",
    optionB_text: "长相普通，能听到刺耳但真实的批评。",
    impactA: { 外貌: 10, 情感: 8, 智慧: -10 },
    impactB: { 智慧: 8, 自我: 6, 外貌: -6 }
  },
  {
    id: 49,
    question_title: "关于事业的顶峰。",
    optionA_text: "你的事业会达到巅峰，代价是你再也无法拥有超过 5 小时的深度睡眠。",
    optionB_text: "事业平平，每天倒头就睡，梦境香甜。",
    impactA: { 权力: 10, 金钱: 8, 健康: -10 },
    impactB: { 健康: 10, 权力: -6, 金钱: -4 }
  },
  {
    id: 50,
    question_title: "关于绝对的孤独。",
    optionA_text: "获得长生不老，代价是每过 50 年，你必须亲自抹杀掉这段时间里最爱你的人。",
    optionB_text: "和爱人一起慢慢变老，然后消失。",
    impactA: { 健康: 10, 权力: 6, 情感: -10 },
    impactB: { 情感: 10, 家庭: 10, 健康: -10 }
  },

  // ==========================================
  // 第三乐章：存在与自我的本质 (51-75)
  // ==========================================
  {
    id: 51,
    question_title: "关于痛苦的结晶。",
    optionA_text: "成为历史上最伟大的诗人，代价是你的一生必须在极度的精神折磨中度过。",
    optionB_text: "拥有一个极其平稳、幸福但灵魂深处一片荒芜的平庸人生。",
    impactA: { 智慧: 10, 自我: 8, 健康: -10, 情感: -6 },
    impactB: { 健康: 8, 情感: 6, 智慧: -8, 自我: -4 }
  },
  {
    id: 52,
    question_title: "关于记忆的清洗。",
    optionA_text: "拥有一台“记忆清洗机”，可以随时删减人生中尴尬、悔恨和痛苦的瞬间。",
    optionB_text: "背负着所有不堪的回忆前行，哪怕它们让你在深夜无法自处。",
    impactA: { 健康: 6, 自由: 4, 自我: -10, 智慧: -6 },
    impactB: { 自我: 10, 智慧: 8, 健康: -4 }
  },
  {
    id: 53,
    question_title: "关于万物的低语。",
    optionA_text: "能感知到草木的生长和星辰的呼吸，代价是你再也听不到人类的语言。",
    optionB_text: "只听得见人类社会的喧嚣，对自然万物保持永恒的迟钝。",
    impactA: { 智慧: 10, 自由: 8, 情感: -10, 家庭: -8 },
    impactB: { 情感: 6, 家庭: 4, 智慧: -6 }
  },
  {
    id: 54,
    question_title: "关于无人知晓。",
    optionA_text: "在一片绝对荒芜但绝美的异星孤独地活上一千年。",
    optionB_text: "在繁华喧闹但充满虚伪的都市中庸碌地活上五十年。",
    impactA: { 自由: 10, 智慧: 8, 情感: -10, 家庭: -10 },
    impactB: { 情感: 4, 家庭: 4, 自由: -8 }
  },
  {
    id: 55,
    question_title: "关于纯粹的恶。",
    optionA_text: "洞察世间所有的恶念并保持清醒，代价是你无法再相信任何善意的动机。",
    optionB_text: "做一个天真的盲目者，在被恶念摧毁前始终相信世界是无瑕的。",
    impactA: { 智慧: 10, 权力: 4, 情感: -10, 自我: -4 },
    impactB: { 情感: 10, 自我: 6, 智慧: -10 }
  },
  {
    id: 56,
    question_title: "关于天赋的诅咒。",
    optionA_text: "出生即巅峰，拥有绝世才华，但在 30 岁时必须死去。",
    optionB_text: "资质平庸，但能健康活到 90 岁。",
    impactA: { 智慧: 10, 外貌: 8, 健康: -10 },
    impactB: { 健康: 10, 智慧: -8 }
  },
  {
    id: 57,
    question_title: "关于情绪的开关。",
    optionA_text: "可以自由关闭任何负面情绪，代价是你同时也关闭了心动的能力。",
    optionB_text: "在情绪的过山车里沉浮，时而绝望，时而狂喜。",
    impactA: { 健康: 8, 情感: -10 },
    impactB: { 情感: 10, 健康: -4 }
  },
  {
    id: 58,
    question_title: "关于被遗忘。",
    optionA_text: "你死后，全世界都会记得你的名字，但没人知道你真实的样子。",
    optionB_text: "你死后，只有几个人记得你，但他们记得的是最真实的你。",
    impactA: { 权力: 10, 情感: -8 },
    impactB: { 情感: 10, 权力: -8 }
  },
  {
    id: 59,
    question_title: "关于信仰。",
    optionA_text: "获得绝对的信仰，内心不再迷茫，代价是你必须盲从教条。",
    optionB_text: "保留怀疑的权利，在无神的世界里痛苦地寻找意义。",
    impactA: { 健康: 8, 自由: -10 },
    impactB: { 自由: 10, 健康: -4 }
  },
  {
    id: 60,
    question_title: "关于对话古人。",
    optionA_text: "能与逝去的智者对话，代价是你被现代人视为疯子。",
    optionB_text: "做个正常人，和同事聊八卦。",
    impactA: { 智慧: 10, 情感: -10 },
    impactB: { 情感: 8, 智慧: -8 }
  },
  {
    id: 61,
    question_title: "关于永恒的爱。",
    optionA_text: "与爱人永远停留在最炽热的那一天，代价是你们的智力也将永远停在那一天。",
    optionB_text: "接受爱意在琐碎与岁月中消磨、变质甚至腐烂。",
    impactA: { 情感: 10, 家庭: 8, 智慧: -8, 自我: -6 },
    impactB: { 智慧: 10, 自我: 8, 情感: -8 }
  },
  {
    id: 62,
    question_title: "关于言出法随。",
    optionA_text: "你说的每一句话都会变成绝对的真理，代价是你失去了沉默的权利。",
    optionB_text: "做一个言语轻微的普通人，在谎言与沉默中寻找安全的缝隙。",
    impactA: { 权力: 10, 智慧: 6, 自由: -10, 情感: -8 },
    impactB: { 自由: 10, 情感: 4, 权力: -8 }
  },
  {
    id: 63,
    question_title: "关于模仿与本真。",
    optionA_text: "通过精准的扮演，获得世俗定义的“完美人生”。",
    optionB_text: "死守着那个怪异、孤僻、不被社会接纳但真实的自我。",
    impactA: { 权力: 8, 外貌: 10, 金钱: 8, 自我: -10 },
    impactB: { 自我: 10, 自由: 6, 权力: -10, 金钱: -6 }
  },
  {
    id: 64,
    question_title: "关于宿命与挣扎。",
    optionA_text: "得知你的努力毫无意义，从而获得彻底的躺平与解脱。",
    optionB_text: "坚信拥有自由意志，在一次次挫败中继续推石上山。",
    impactA: { 自由: 10, 健康: 4, 智慧: 4, 自我: -8 },
    impactB: { 自我: 10, 智慧: 8, 自由: -6, 健康: -4 }
  },
  {
    id: 65,
    question_title: "关于无知的极乐。",
    optionA_text: "切断大脑中关于“自我意识”的部分，像快乐的动物一样活着。",
    optionB_text: "保留沉重的自我意识，清醒地观察自己走向虚无。",
    impactA: { 健康: 10, 情感: 4, 智慧: -10, 自我: -10 },
    impactB: { 智慧: 10, 自我: 10, 健康: -6 }
  },
  {
    id: 66,
    question_title: "关于交换性别。",
    optionA_text: "体验异性的人生，代价是你永远无法再变回来。",
    optionB_text: "安守本分，猜测另一种性别的感受。",
    impactA: { 自由: 8, 自我: -6 },
    impactB: { 自我: 8, 自由: -2 }
  },
  {
    id: 67,
    question_title: "关于看见未来。",
    optionA_text: "看见自己具体的死亡日期，从而能够规划余生。",
    optionB_text: "对死亡一无所知，在恐惧和希望中度日。",
    impactA: { 智慧: 10, 自由: -4, 情感: -6 },
    impactB: { 自由: 8, 智慧: -4 }
  },
  {
    id: 68,
    question_title: "关于不朽的作品。",
    optionA_text: "写出一本被人类传颂千年的书，代价是你必须终身监禁。",
    optionB_text: "自由地活着，写一些没人看的日记。",
    impactA: { 智慧: 10, 权力: 8, 自由: -10 },
    impactB: { 自由: 10, 权力: -8 }
  },
  {
    id: 69,
    question_title: "关于灵魂的透明。",
    optionA_text: "你的灵魂在别人眼中是透明可见的，无法隐藏任何秘密。",
    optionB_text: "拥有一层厚厚的面具，没人知道你在想什么。",
    impactA: { 情感: 8, 自由: -10 },
    impactB: { 自由: 10, 情感: -6 }
  },
  {
    id: 70,
    question_title: "关于痛苦的转移。",
    optionA_text: "可以将身体的痛苦转移给别人，代价是你的灵魂会变黑。",
    optionB_text: "独自忍受痛苦，保持灵魂的纯白。",
    impactA: { 健康: 10, 自我: -10 },
    impactB: { 自我: 10, 健康: -8 }
  },
  {
    id: 71,
    question_title: "关于最后的灯火。",
    optionA_text: "作为文明最后的守护者，独自生活在黑暗的避难所。",
    optionB_text: "在末日的狂欢中与众人一起在瞬间湮灭。",
    impactA: { 智慧: 10, 权力: 6, 情感: -10, 家庭: -10 },
    impactB: { 情感: 8, 自由: 6, 智慧: -10 }
  },
  {
    id: 72,
    question_title: "关于绝对的共情。",
    optionA_text: "能瞬间感受到方圆百里内所有人的痛苦，代价是你无法屏蔽这种感知。",
    optionB_text: "保持情感的冷漠与麻木，在悲剧面前维持优雅。",
    impactA: { 情感: 10, 智慧: 8, 健康: -10, 自我: -6 },
    impactB: { 健康: 8, 权力: 6, 情感: -10, 智慧: -4 }
  },
  {
    id: 73,
    question_title: "关于最后的告别。",
    optionA_text: "在梦中与死去的爱人重逢，代价是你清醒时会彻底忘记他们的长相。",
    optionB_text: "在清醒时痛苦地守着照片，但梦里永远只有一片虚无。",
    impactA: { 情感: 10, 健康: -6, 智慧: -8, 自我: -4 },
    impactB: { 自我: 8, 情感: -4, 健康: -2 }
  },
  {
    id: 74,
    question_title: "关于岁月的慈悲。",
    optionA_text: "记得生命中所有的美好，代价是你必须同时承受所有从未愈合的创伤。",
    optionB_text: "忘却所有的痛苦，代价是你的灵魂也随之变得轻浮。",
    impactA: { 智慧: 8, 情感: 10, 健康: -10, 自我: 6 },
    impactB: { 健康: 8, 智慧: -10, 自我: -8, 情感: -6 }
  },
  {
    id: 75,
    question_title: "关于未寄出的信。",
    optionA_text: "你一生都在为某人默默付出，直到死他们都不知道你的存在。",
    optionB_text: "你接受了他们的爱，但代价是你必须亲手毁掉他们原本平静的生活。",
    impactA: { 自我: 10, 情感: -10, 家庭: -6 },
    impactB: { 情感: 10, 家庭: -10, 自我: -8 }
  },

  // ==========================================
  // 第四乐章：虚无、终局与无力感 (76-100)
  // ==========================================
  {
    id: 76,
    question_title: "关于消失的色彩。",
    optionA_text: "能看到世界最真实的丑陋与绝望，从而获得绝对的冷静。",
    optionB_text: "即便双目失明，也要靠着记忆中的一丝暖色在幻觉中活下去。",
    impactA: { 智慧: 10, 权力: 6, 情感: -10, 健康: -4 },
    impactB: { 情感: 8, 自我: 6, 智慧: -10, 健康: -6 }
  },
  {
    id: 77,
    question_title: "关于孤独的守护。",
    optionA_text: "成为守护城市的无名神灵，代价是你永远无法与任何人类产生物理接触。",
    optionB_text: "作为一个脆弱的凡人，在人群中拥抱、争吵并最终消失。",
    impactA: { 权力: 10, 智慧: 6, 情感: -10, 自由: -8 },
    impactB: { 情感: 10, 家庭: 8, 健康: -6, 权力: -10 }
  },
  {
    id: 78,
    question_title: "关于迟到的道歉。",
    optionA_text: "回到过去说对不起，代价是对方会彻底忘记你。",
    optionB_text: "带着这份永远无法弥补的愧疚，沉重地走完余生。",
    impactA: { 自我: 8, 情感: -6, 智慧: -4 },
    impactB: { 智慧: 10, 自我: -8, 健康: -6 }
  },
  {
    id: 79,
    question_title: "关于枯萎的美学。",
    optionA_text: "在人生最高光的时刻瞬间离世，留下永恒的绝美瞬间。",
    optionB_text: "看着才华和美貌一点点枯萎，最终在衰老中无声无息地熄灭。",
    impactA: { 外貌: 10, 自我: 10, 健康: -10, 情感: -8 },
    impactB: { 健康: -6, 外貌: -10, 自我: -4, 智慧: 8 }
  },
  {
    id: 80,
    question_title: "关于影子的陪伴。",
    optionA_text: "化作一阵风或一朵云，看遍人间悲欢，却无法干预分毫。",
    optionB_text: "作为一粒尘埃卷入时代洪流，虽然会被碾碎，但你存在过。",
    impactA: { 自由: 10, 智慧: 6, 情感: -10, 健康: 10 },
    impactB: { 自我: 10, 健康: -10, 自由: -8, 情感: 4 }
  },
  {
    id: 81,
    question_title: "关于轮回的记忆。",
    optionA_text: "带着前世的记忆重生，代价是你永远无法融入新的人生。",
    optionB_text: "喝下孟婆汤，干干净净地重来。",
    impactA: { 智慧: 10, 自我: -10, 情感: -8 },
    impactB: { 情感: 8, 智慧: -6 }
  },
  {
    id: 82,
    question_title: "关于唯一的幸存者。",
    optionA_text: "在一场灾难中独自存活，背负所有遇难者的期望。",
    optionB_text: "与众人一同死去，免受灵魂折磨。",
    impactA: { 健康: 10, 自我: -10 },
    impactB: { 自我: 10, 健康: -10 }
  },
  {
    id: 83,
    question_title: "关于被铭记的方式。",
    optionA_text: "作为一个暴君被历史永远铭记。",
    optionB_text: "作为一个好人被历史彻底遗忘。",
    impactA: { 权力: 10, 自我: -10 },
    impactB: { 自我: 10, 权力: -10 }
  },
  {
    id: 84,
    question_title: "关于完美的句号。",
    optionA_text: "你可以选择自己死亡的方式和时间，精准控制离场。",
    optionB_text: "把死亡交给命运，哪怕它来得狼狈不堪。",
    impactA: { 权力: 8, 自由: 10, 情感: -10 },
    impactB: { 自由: 8, 权力: -6 }
  },
  {
    id: 85,
    question_title: "关于无声的呐喊。",
    optionA_text: "你在世界上发出的声音没人能听见，但你的画作价值连城。",
    optionB_text: "你的画一文不值，但你的歌声能治愈千万人。",
    impactA: { 金钱: 10, 情感: -10 },
    impactB: { 情感: 10, 金钱: -8 }
  },
  {
    id: 86,
    question_title: "关于语言的尽头。",
    optionA_text: "你的心意永远能被准确传达，代价是你无法感受共鸣。",
    optionB_text: "一生都在试图向他人解释自己，却在无尽的误解中老去。",
    impactA: { 情感: 6, 家庭: 6, 智慧: -10, 自由: -4 },
    impactB: { 自我: 10, 智慧: 6, 情感: -10, 家庭: -6 }
  },
  {
    id: 87,
    question_title: "关于未竟的梦想。",
    optionA_text: "在死前那一刻得知你毕生追求的目标其实是个错误。",
    optionB_text: "带着对那个错误目标的信仰，幸福死掉。",
    impactA: { 智慧: 10, 自我: -10, 情感: -8 },
    impactB: { 情感: 8, 智慧: -10, 自我: -4 }
  },
  {
    id: 88,
    question_title: "关于冬天的太阳。",
    optionA_text: "经历过一次极致的爱情，代价是余下的 50 年都在孤独中回忆它。",
    optionB_text: "一辈子过着平淡、从无心动的日子。",
    impactA: { 情感: 10, 自我: 6, 健康: -8, 智慧: 4 },
    impactB: { 健康: 8, 情感: -8, 智慧: -4 }
  },
  {
    id: 89,
    question_title: "关于夕阳下的奔跑。",
    optionA_text: "明知徒劳，却依然倾尽所有去拯救注定消失的东西。",
    optionB_text: "理智地放弃，站在高处冷眼看着它化为灰烬。",
    impactA: { 自我: 10, 情感: 6, 健康: -8, 金钱: -10 },
    impactB: { 智慧: 10, 金钱: 8, 自我: -10, 情感: -8 }
  },
  {
    id: 90,
    question_title: "关于存在的重量。",
    optionA_text: "消失在所有人的记忆里，就像你从未在这个世界出现过。",
    optionB_text: "留下一段被后人反复曲解甚至羞辱的历史。",
    impactA: { 自由: 10, 情感: -10, 自我: -10 },
    impactB: { 权力: 4, 智慧: 6, 自我: 10, 情感: -8 }
  },
  {
    id: 91,
    question_title: "关于雨中的等待。",
    optionA_text: "为了一个永远不会回来的答案，在原地站成一座石像。",
    optionB_text: "头也不回地走向未知的荒原。",
    impactA: { 家庭: 6, 情感: 4, 自由: -10, 健康: -8 },
    impactB: { 自由: 10, 自我: 10, 家庭: -10, 情感: -6 }
  },
  {
    id: 92,
    question_title: "关于破碎的镜子。",
    optionA_text: "修补好所有的关系，代价是你的灵魂不再纯粹。",
    optionB_text: "守着你那洁净但支离破碎的孤独。",
    impactA: { 情感: 8, 家庭: 10, 自我: -10 },
    impactB: { 自我: 10, 家庭: -10, 情感: -8 }
  },
  {
    id: 93,
    question_title: "关于最后一首歌。",
    optionA_text: "唱出一首能让神灵落泪的歌，代价是唱完之后你将失聪失声。",
    optionB_text: "作为一个平庸的听众，在嘈杂中度过一生。",
    impactA: { 智慧: 10, 自我: 8, 健康: -10, 情感: -6 },
    impactB: { 健康: 6, 智慧: -6, 自我: -4 }
  },
  {
    id: 94,
    question_title: "关于时间的尘埃。",
    optionA_text: "能看到数百年后你的坟墓前荒草凄凄的景象。",
    optionB_text: "能看到你最恨的人在这一刻正享受着幸福。",
    impactA: { 智慧: 10, 自由: 4, 情感: -6 },
    impactB: { 自我: -10, 情感: -8, 智慧: 6 }
  },
  {
    id: 95,
    question_title: "关于无力的救赎。",
    optionA_text: "替全世界分担痛苦，但你自己承受叠加且没人会感激你。",
    optionB_text: "关上窗户，享受一份心安理得的下午茶。",
    impactA: { 自我: 10, 健康: -10, 情感: 10, 权力: -8 },
    impactB: { 健康: 8, 自我: -10, 情感: -6 }
  },
  {
    id: 96,
    question_title: "关于最后的灯塔。",
    optionA_text: "你死后，你的思想才会被世界理解。",
    optionB_text: "生前被奉为神明，死后被揭穿只是个骗局。",
    impactA: { 智慧: 10, 权力: 6, 自我: 8, 情感: -10 },
    impactB: { 权力: 10, 金钱: 8, 自我: -10, 情感: -4 }
  },
  {
    id: 97,
    question_title: "关于灵魂的厚度。",
    optionA_text: "拥有一颗脆弱、易碎但极其敏感的心。",
    optionB_text: "拥有一颗坚硬、冰冷、永远不会受伤的心。",
    impactA: { 情感: 10, 智慧: 6, 健康: -8, 自我: 4 },
    impactB: { 健康: 10, 权力: 8, 情感: -10, 自我: -6 }
  },
  {
    id: 98,
    question_title: "关于终极的平庸。",
    optionA_text: "承认自己只是 80 亿人中毫无特点的基数。",
    optionB_text: "一生都在为了证明自己的特别而痛苦挣扎。",
    impactA: { 自由: 10, 健康: 8, 自我: -8, 智慧: 4 },
    impactB: { 自我: 10, 智慧: 8, 健康: -10, 自由: -6 }
  },
  {
    id: 99,
    question_title: "关于临终的宽恕。",
    optionA_text: "宽恕那些从未向你道歉的仇人，代价是正义感土崩瓦解。",
    optionB_text: "带着诅咒闭上眼睛，以此守住最后的尊严。",
    impactA: { 情感: 6, 自由: 8, 自我: -10 },
    impactB: { 自我: 10, 情感: -10, 健康: -6 }
  },
  {
    id: 100,
    question_title: "关于圆满。",
    optionA_text: "带着现在的觉悟回到起点，但注定要再次经历所有的失去。",
    optionB_text: "合上书本，让这一切在此时此刻，静静地终结。",
    impactA: { 智慧: 10, 自我: 8, 健康: -10, 自由: -10 },
    impactB: { 自由: 10, 智慧: 10, 健康: 10, 情感: 10, 权力: 10, 金钱: 10, 外貌: 10, 自我: 10, 家庭: 10 }
  }
];