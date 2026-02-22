"use client";

interface PrivilegeSectionProps {
  privileges: { key: string; name: string }[];
}

export default function PrivilegeSection({ privileges }: PrivilegeSectionProps) {
  if (privileges.length === 0) {
    return (
      <div>
        <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">已解锁权限</p>
        <p className="text-sm text-zinc-600">暂无</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">已解锁权限</p>
      <ul className="space-y-3">
        {privileges.map((p) => (
          <li key={p.key} className="border-l border-white/15 pl-4 text-sm leading-relaxed text-zinc-400">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
