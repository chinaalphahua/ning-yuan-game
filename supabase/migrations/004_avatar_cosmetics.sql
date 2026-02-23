-- 头像装扮：物品定义、用户背包、装备栏（黑白无色彩，人人可用）

-- 1. 装扮物品表
CREATE TABLE IF NOT EXISTS public.avatar_cosmetics (
  key text PRIMARY KEY,
  name text NOT NULL,
  slot text NOT NULL CHECK (slot IN ('hair', 'face', 'accessory')),
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  description text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false
);

-- 2. 用户拥有的装扮（同一件可多次开出，用 quantity 表示）
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_key text NOT NULL REFERENCES public.avatar_cosmetics(key) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  first_obtained_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, cosmetic_key)
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id);

-- 3. profiles 装备栏
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_hair_key text REFERENCES public.avatar_cosmetics(key) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_face_key text REFERENCES public.avatar_cosmetics(key) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipped_accessory_key text REFERENCES public.avatar_cosmetics(key) ON DELETE SET NULL;

-- 4. RLS
ALTER TABLE public.avatar_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read avatar_cosmetics" ON public.avatar_cosmetics FOR SELECT USING (true);

CREATE POLICY "Users can read own user_cosmetics" ON public.user_cosmetics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_cosmetics" ON public.user_cosmetics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_cosmetics" ON public.user_cosmetics FOR UPDATE USING (auth.uid() = user_id);

-- 5. Seed 100 件装扮（黑白、含说明；默认人人可用：短发+素面）
INSERT INTO public.avatar_cosmetics (key, name, slot, rarity, description, is_default) VALUES
('hair_short_black', '短黑发', 'hair', 'common', '利落黑色短发，轮廓清晰。', true),
('hair_short_brown', '短褐发', 'hair', 'common', '自然褐色短发，沉稳干净。', false),
('hair_ponytail', '马尾', 'hair', 'common', '束于脑后的马尾，简洁利落。', false),
('hair_loose_long', '披肩长发', 'hair', 'common', '垂落肩头的长发，线条柔和。', false),
('hair_curly', '卷发', 'hair', 'common', '微微卷曲，层次分明。', false),
('hair_bob', '齐肩短发', 'hair', 'common', '齐肩长度，整齐好打理。', false),
('hair_messy', '凌乱发', 'hair', 'common', '略带凌乱，随性自然。', false),
('hair_slicked', '背头', 'hair', 'common', '向后梳拢，线条硬朗。', false),
('hair_bangs', '齐刘海', 'hair', 'common', '额前齐整刘海，乖巧端正。', false),
('hair_twin_tails', '双马尾', 'hair', 'common', '左右双束，对称规整。', false),
('hair_braid', '单辫', 'hair', 'common', '单条发辫，朴素大方。', false),
('hair_bun', '发髻', 'hair', 'common', '挽成发髻，端庄简洁。', false),
('hair_undercut', '侧削', 'hair', 'common', '一侧剃短，对比分明。', false),
('hair_wavy', '波浪发', 'hair', 'common', '波浪起伏，轮廓柔和。', false),
('hair_straight', '直发', 'hair', 'common', '笔直垂下，线条干净。', false),
('hair_side_part', '偏分', 'hair', 'common', '侧分线清晰，利落整齐。', false),
('hair_buzz', '寸头', 'hair', 'common', '极短寸头，干净利落。', false),
('hair_flowing', '飘逸长发', 'hair', 'common', '长发垂散，动感线条。', false),
('face_calm', '平静', 'face', 'common', '神情平静，无悲无喜。', false),
('face_smile', '微笑', 'face', 'common', '嘴角微扬，温和可亲。', false),
('face_serious', '严肃', 'face', 'common', '眉目端正，神色认真。', false),
('face_gentle', '温和', 'face', 'common', '目光柔和，令人安心。', false),
('face_neutral', '淡然', 'face', 'common', '平淡自然，不显情绪。', false),
('face_thoughtful', '沉思', 'face', 'common', '似在思考，安静内敛。', false),
('face_sleepy', '困倦', 'face', 'common', '略带困意，松弛自然。', false),
('face_focused', '专注', 'face', 'common', '目光集中，心无旁骛。', false),
('face_soft', '柔和', 'face', 'common', '轮廓与神情皆柔和。', false),
('face_reserved', '内敛', 'face', 'common', '不张扬，含蓄克制。', false),
('face_quiet', '静默', 'face', 'common', '不言不语，安静沉稳。', false),
('face_curious', '好奇', 'face', 'common', '略带探询，略显好奇。', false),
('face_tired', '疲惫', 'face', 'common', '略显疲惫，真实自然。', false),
('face_blush', '微醺', 'face', 'common', '微微泛红，如微醺之态。', false),
('face_cool', '冷峻', 'face', 'common', '线条冷硬，不苟言笑。', false),
('face_warm', '暖意', 'face', 'common', '神情温和，带一丝暖意。', false),
('face_default', '素面', 'face', 'common', '无多余修饰，最本真的面容。', true),
('acc_band', '发带', 'accessory', 'common', '一条素色发带，束发或装饰。', false),
('acc_glasses_round', '圆框镜', 'accessory', 'common', '圆形镜框，斯文干净。', false),
('acc_earring_single', '单耳环', 'accessory', 'common', '单侧耳环，简约一点。', false),
('acc_scarf', '围巾', 'accessory', 'common', '素色围巾，绕颈或垂落。', false),
('acc_hat_cap', '鸭舌帽', 'accessory', 'common', '帽檐清晰，轮廓分明。', false),
('acc_ribbon', '发绳', 'accessory', 'common', '细发绳扎发，简单实用。', false),
('acc_flower', '头花', 'accessory', 'common', '一朵素色头花，不抢眼。', false),
('acc_chain', '细链', 'accessory', 'common', '细链饰物，线条简洁。', false),
('acc_bandana', '头巾', 'accessory', 'common', '包头或束发用头巾。', false),
('acc_clip', '发夹', 'accessory', 'common', '一枚发夹，固定或点缀。', false),
('acc_hoop', '耳圈', 'accessory', 'common', '圆形耳圈，轮廓清晰。', false),
('acc_pin', '胸针', 'accessory', 'common', '一枚小胸针，点缀胸前。', false),
('acc_ring_simple', '素戒', 'accessory', 'common', '无纹素戒，低调干净。', false),
('acc_spectacles', '眼镜', 'accessory', 'common', '常规眼镜，斯文整齐。', false),
('acc_visor', '护额', 'accessory', 'common', '额前一条带，利落有型。', false),
('hair_silver_streak', '银丝一缕', 'hair', 'rare', '一缕银白发丝，在深色中格外清晰。', false),
('hair_phantom_veil', '幻影薄纱', 'hair', 'rare', '如薄纱覆发，轮廓若隐若现。', false),
('hair_moon_frost', '月霜', 'hair', 'rare', '似月光下的霜色，清冷干净。', false),
('hair_ember_flow', '余烬流', 'hair', 'rare', '如灰烬流动的线条与层次。', false),
('hair_shadow_cascade', '暗影瀑', 'hair', 'rare', '如阴影垂落，层次分明。', false),
('hair_dust_wind', '尘风', 'hair', 'rare', '似被风吹起的尘埃，轻而乱。', false),
('hair_ash_crown', '灰烬冠', 'hair', 'rare', '发如冠形，灰调沉稳。', false),
('hair_star_drift', '星屑飘', 'hair', 'rare', '发间似有星点，疏密有致。', false),
('hair_void_curl', '虚空卷', 'hair', 'rare', '深色卷曲，如入虚空。', false),
('hair_soul_weave', '魂织', 'hair', 'rare', '如灵魂编织的发丝，细密而静。', false),
('face_mirror', '镜面', 'face', 'rare', '如镜中倒影，平静无波。', false),
('face_echo', '回响', 'face', 'rare', '似有回响的神情，留有余韵。', false),
('face_whisper', '低语', 'face', 'rare', '如正在低语，含蓄克制。', false),
('face_veil', '薄暮', 'face', 'rare', '如薄暮笼罩，朦胧而静。', false),
('face_ember', '余温', 'face', 'rare', '神情带一丝将熄的余温。', false),
('face_frost', '霜痕', 'face', 'rare', '冷峻如霜，线条清晰。', false),
('face_shadow', '影迹', 'face', 'rare', '如半掩于影，神秘不张扬。', false),
('face_glow', '微光', 'face', 'rare', '神情似有微光，不刺眼。', false),
('face_ripple', '涟漪', 'face', 'rare', '情绪如水面涟漪，轻微波动。', false),
('face_silence', '静寂', 'face', 'rare', '彻底的静，无喧无扰。', false),
('acc_mask_half', '半面', 'accessory', 'rare', '遮住半脸的素色面饰。', false),
('acc_crown_thorn', '荆棘冠', 'accessory', 'rare', '如荆棘缠绕的冠形，黑白线条。', false),
('acc_orb_small', '浮珠', 'accessory', 'rare', '一颗小珠悬于身侧，圆润简洁。', false),
('acc_feather', '羽饰', 'accessory', 'rare', '一支素色羽毛，线条轻盈。', false),
('acc_chain_ritual', '仪式链', 'accessory', 'rare', '细链如仪式用，规整而克制。', false),
('acc_lens_amber', '琥珀镜片', 'accessory', 'rare', '镜片呈深琥珀色，在黑白中为深调。', false),
('acc_veil_light', '轻纱', 'accessory', 'rare', '一层轻纱，不夺目。', false),
('acc_sigil', '符纹', 'accessory', 'rare', '简单符纹饰物，线条明确。', false),
('acc_ring_band', '铭文环', 'accessory', 'rare', '环上刻有细密铭文，可辨轮廓。', false),
('acc_collar_bone', '骨扣领', 'accessory', 'rare', '领口骨扣造型，轮廓硬朗。', false),
('hair_astral_flow', '星流', 'hair', 'epic', '发如星河流泻，黑白分明。', false),
('hair_void_weave', '虚空织', 'hair', 'epic', '如从虚空中织出的发，深而密。', false),
('hair_eternal_frost', '永霜', 'hair', 'epic', '如永不消融的霜，清冽干净。', false),
('hair_ember_crown', '烬冠', 'hair', 'epic', '灰烬成冠，层次与轮廓并重。', false),
('hair_phantom_cascade', '幻瀑', 'hair', 'epic', '如幻影般的发瀑，若隐若现。', false),
('face_soul_mark', '魂印', 'face', 'epic', '如灵魂留下的印记，静而深。', false),
('face_astral_eye', '星瞳', 'face', 'epic', '目光如星，清晰而专注。', false),
('face_void_gaze', '虚空之视', 'face', 'epic', '如望向虚空，深邃冷静。', false),
('face_eternal_calm', '永恒静', 'face', 'epic', '恒久的平静，无波无澜。', false),
('face_ember_smile', '烬笑', 'face', 'epic', '如余烬中一丝笑意，克制而淡。', false),
('acc_crown_soul', '灵魂冠冕', 'accessory', 'epic', '冠冕轮廓如灵魂之形，黑白勾勒。', false),
('acc_mask_void', '虚空面', 'accessory', 'epic', '如虚空般的面饰，深色轮廓。', false),
('acc_orb_soul', '魂珠', 'accessory', 'epic', '如凝练灵魂的珠体，圆润而静。', false),
('acc_veil_astral', '星纱', 'accessory', 'epic', '如星尘织成的薄纱，细密有致。', false),
('acc_sigil_eternal', '永恒符', 'accessory', 'epic', '永恒主题的符纹，线条庄重。', false),
('hair_ningyuan', '宁愿·荒原', 'hair', 'legendary', '荒原上的风与发丝，黑白中的唯一归宿。', false),
('face_soul_sovereign', '灵魂主宰', 'face', 'legendary', '灵魂的主宰之相，平静而有力。', false),
('acc_crown_ningyuan', '宁愿冠', 'accessory', 'legendary', '宁愿之冠，荒原与灵魂的象征。', false),
('acc_orb_truth', '真理之珠', 'accessory', 'legendary', '象征真理的珠体，黑白分明。', false),
('face_truth_seeker', '真理追寻', 'face', 'legendary', '追寻真理者的神情，坚定而清澈。', false)
ON CONFLICT (key) DO NOTHING;

-- 6. 现有用户：发放默认装扮并设置装备
INSERT INTO public.user_cosmetics (user_id, cosmetic_key, quantity)
SELECT p.id, k.key, 1
FROM public.profiles p
CROSS JOIN (SELECT unnest(ARRAY['hair_short_black', 'face_default']) AS key) k
ON CONFLICT (user_id, cosmetic_key) DO NOTHING;

UPDATE public.profiles
SET equipped_hair_key = 'hair_short_black', equipped_face_key = 'face_default'
WHERE equipped_hair_key IS NULL;
