import { FolderOpen } from "lucide-react";
import { RepositoryBackButton } from "./RepositoryBackButton";

export function RepositorySectionHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Repository",
}) {
  return (
    <div className="mb-5 sm:mb-8">
      <div className="mb-3 sm:mb-5">
        <RepositoryBackButton onClick={onBack} label={backLabel} />
      </div>

      <h1 className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
        {title}
      </h1>
      <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1 max-w-2xl">
        {subtitle}
      </p>
    </div>
  );
}
