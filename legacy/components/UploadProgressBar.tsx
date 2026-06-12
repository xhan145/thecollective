export function UploadProgressBar({ progress, label = "Uploading proof media" }: { progress: number; label?: string }) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-bold text-[#c8c2b8]">{label}</span>
        <span className="font-black text-purple2">{safeProgress}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-purple to-purple2 transition-all" style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}
