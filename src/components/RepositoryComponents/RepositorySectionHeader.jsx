import { FolderOpen } from "lucide-react";
import { RepositoryBackButton } from "./RepositoryBackButton";

export function RepositorySectionHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Repository",
}) {
  return (
    <div className="mb-8">
      <div className="mb-5">
        <RepositoryBackButton onClick={onBack} label={backLabel} />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-3 py-1.5 mb-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        <FolderOpen size={13} className="text-sky-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Section Folder Library
        </span>
      </div>

      <h1 className="mt-4 text-[clamp(1.5rem,2.5vw,2.5rem)] font-black tracking-[-0.06em] text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[0.95rem]">
        {subtitle}
      </p>
    </div>
  );
}
