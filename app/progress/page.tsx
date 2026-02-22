"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressLayout from "./components/ProgressLayout";
import LevelTitleCard from "./components/LevelTitleCard";
import XpProgressBar from "./components/XpProgressBar";
import InsightBalance from "./components/InsightBalance";
import PointsBalance from "./components/PointsBalance";
import PrivilegeList from "./components/PrivilegeList";
import GrowthTimeline from "./components/GrowthTimeline";

type GrowthData = {
  level: number;
  xp: number;
  points: number;
  insight: number;
  privileges: { key: string; name: string }[];
};

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState<GrowthData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          router.replace("/");
          return;
        }
        return fetch("/api/growth");
      })
      .then((r) => r?.json?.())
      .then((d) => {
        if (d?.level != null && d?.xp != null) {
          const privs = Array.isArray(d?.privileges) ? d.privileges : [];
          const arr = privs.map((p: { key: string; name?: string }) => ({
            key: p.key,
            name: p.name ?? p.key,
          }));
          setGrowth({
            level: d.level,
            xp: d.xp,
            points: d.points ?? 0,
            insight: d.insight ?? 0,
            privileges: arr,
          });
        } else {
          setGrowth(null);
        }
      })
      .catch(() => setGrowth(null))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <ProgressLayout>
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="h-5 w-5 animate-pulse rounded-full border border-white/20" />
        </div>
      </ProgressLayout>
    );
  }

  if (!growth) {
    return (
      <ProgressLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20">
          <p className="text-sm text-zinc-500">无法加载成长数据</p>
          <Link
            href="/"
            className="rounded border border-white/20 px-6 py-2 text-sm text-white/80 transition hover:bg-white/5"
          >
            返回首页
          </Link>
        </div>
      </ProgressLayout>
    );
  }

  const unlockedKeys = new Set(growth.privileges.map((p) => p.key));

  return (
    <ProgressLayout>
      <div className="mx-auto max-w-md">
        <LevelTitleCard level={growth.level} />
        <XpProgressBar xp={growth.xp} level={growth.level} />
        <PointsBalance points={growth.points} />
        <InsightBalance insight={growth.insight} />
        <PrivilegeList privileges={growth.privileges} />
        <GrowthTimeline level={growth.level} unlockedPrivilegeKeys={unlockedKeys} />
      </div>
    </ProgressLayout>
  );
}
