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
      <div className="mb-4">
        <RepositoryBackButton onClick={onBack} label={backLabel} />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-4">
        <FolderOpen size={13} className="text-teal-500" />
        <span className="text-[11px] font-semibold text-teal-600 tracking-wide uppercase">
          Section Folder Library
        </span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">
        {title}
      </h1>
      <p className="text-gray-500 mt-1.5 text-sm leading-relaxed max-w-2xl">
        {subtitle}
      </p>
    </div>
  );
}
