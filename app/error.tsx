"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col items-center justify-center bg-[#08080f] p-6 text-center">
      <div className="glass-bg" aria-hidden />
      <div className="glass-lg relative z-10 flex flex-col items-center gap-4 rounded-2xl p-6 max-w-sm">
        <p className="text-sm text-zinc-400">出了点问题</p>
        <p className="max-w-sm text-xs text-zinc-500">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="glass rounded-xl border-white/20 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
        >
          重试
        </button>
      </div>
    </div>
  );
}
