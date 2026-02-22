"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProfileLayout from "./components/ProfileLayout";
import ProfileHeader from "./components/ProfileHeader";
import DataPanel from "./components/DataPanel";
import InsightTimeline from "./components/InsightTimeline";
import BadgeWall from "./components/BadgeWall";
import SimilarSoulsBlock from "./components/SimilarSoulsBlock";
import PrivilegeSection from "./components/PrivilegeSection";

type ProfileData = {
  profile: {
    id: string;
    soul_id: string;
    display_name: string | null;
    level: number;
    xp: number;
    points: number;
    insight: number;
    created_at: string;
  };
  achievements: { key: string; name: string; description: string | null; icon: string | null; unlocked_at: string }[];
  badges: { key: string; name: string; description: string | null; icon: string | null; unlocked_at: string }[];
  privileges: { key: string; name: string }[];
  insight_records: { id: string; content: string; depth_score: number | null; ai_comment: string | null; insight_rank: string | null; source: string; created_at: string }[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          router.replace("/");
          return;
        }
        return fetch("/api/profile");
      })
      .then((r) => r?.json?.())
      .then((d) => {
        if (d?.profile) setData(d);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <ProfileLayout>
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="h-5 w-5 animate-pulse rounded-full border border-white/20" />
        </div>
      </ProfileLayout>
    );
  }

  if (!data) {
    return (
      <ProfileLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20">
          <p className="text-sm text-zinc-500">无法加载个人数据</p>
          <Link href="/" className="rounded border border-white/20 px-6 py-2 text-sm text-white/80 transition hover:bg-white/5">
            返回首页
          </Link>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="mx-auto max-w-md space-y-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ProfileHeader
            soulId={data.profile.soul_id}
            displayName={data.profile.display_name}
            level={data.profile.level}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <DataPanel
            level={data.profile.level}
            xp={data.profile.xp}
            points={data.profile.points}
            insight={data.profile.insight}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <InsightTimeline records={data.insight_records} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <BadgeWall badges={data.badges} achievements={data.achievements} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <SimilarSoulsBlock
            hasPrivilege={data.privileges.some((p) => p.key === "view_similar_souls")}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <PrivilegeSection privileges={data.privileges} />
        </motion.div>
      </div>
    </ProfileLayout>
  );
}
