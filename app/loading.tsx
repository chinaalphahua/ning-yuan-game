export default function Loading() {
  return (
    <div className="relative flex h-full min-h-[100dvh] items-center justify-center bg-[#08080f] text-zinc-400">
      <div className="glass-bg" aria-hidden />
      <div className="glass relative z-10 flex flex-col items-center gap-3 rounded-2xl px-8 py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
        <p className="text-xs tracking-wider text-zinc-500">加载中</p>
      </div>
    </div>
  );
}
