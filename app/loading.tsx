export default function Loading() {
  return (
    <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#08080f] text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="glass-bg" aria-hidden />
      <div className="glass relative z-10 flex flex-col items-center gap-3 rounded-2xl px-8 py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="text-xs tracking-wider text-white/60">加载中</p>
      </div>
    </div>
  );
}
