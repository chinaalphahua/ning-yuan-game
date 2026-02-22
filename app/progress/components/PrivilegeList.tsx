"use client";

import Link from "next/link";
import { getPrivilegeLink } from "@/constants/privilegeLinks";

interface Privilege {
  key: string;
  name: string;
}

interface PrivilegeListProps {
  privileges: Privilege[];
}

export default function PrivilegeList({ privileges }: PrivilegeListProps) {
  if (privileges.length === 0) {
    return (
      <div className="mb-12">
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          已解锁权限
        </p>
        <p className="text-sm text-zinc-600">
          暂无
        </p>
      </div>
    );
  }
  return (
    <div className="mb-12">
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
        已解锁权限
      </p>
      <ul className="space-y-3">
        {privileges.map((p) => {
          const link = getPrivilegeLink(p.key);
          return (
            <li
              key={p.key}
              className="border-l border-white/15 pl-4 text-sm leading-relaxed text-zinc-400"
            >
              {link ? (
                <Link
                  href={link.href}
                  className="text-zinc-400 transition hover:text-white/80 hover:underline"
                >
                  {link.label}
                </Link>
              ) : (
                p.name
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
