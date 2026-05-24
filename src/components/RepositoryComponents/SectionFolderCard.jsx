import { Calendar, FileText, FolderOpen, Plus, User } from "lucide-react";

export function SectionFolderCard({
  name,
  fileCount,
  date,
  owner,
  onClick,
  variant = "folder",
}) {
  if (variant === "create") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="min-h-[218px] w-full rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-8 text-center transition-all hover:border-teal-300 hover:bg-teal-50/40"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
          <Plus size={24} />
        </div>
        <h3 className="text-sm font-semibold text-gray-500">Create Section</h3>
        <p className="mt-1 text-xs text-gray-400">Add to this division</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[218px] w-full rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-teal-200 hover:shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
          <FolderOpen size={24} className="text-teal-500" />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Active
        </span>
      </div>

      <h3 className="text-base font-bold uppercase tracking-tight text-gray-900">
        {name}
      </h3>

      <div className="mt-4 space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-gray-400" />
          <span>{fileCount} files</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-gray-400" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={12} className="text-gray-400" />
          <span>{owner}</span>
        </div>
      </div>
    </button>
  );
}
