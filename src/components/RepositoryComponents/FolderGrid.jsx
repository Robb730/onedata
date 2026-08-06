import { FolderOpen } from "lucide-react";
import { FolderCard } from "./FolderCard";

/**
 * FolderGrid — Renders the folder count summary and the responsive
 * grid of FolderCard components. All folders are accessible.
 *
 * @param {Array}    folders              — filtered folder data array
 * @param {function} [onFolderClick]      — callback when a folder is clicked
 * @param {function} [onFolderColorChange] — callback(folderName, colorPreset)
 */
export function FolderGrid({
  folders = [],
  viewMode = "grid",
  onFolderClick,
  onFolderColorChange,
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{folders.length}</span> folders
        </p>
      </div>

      {folders.length === 0 ? (
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-12 text-center shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <FolderOpen className="mx-auto mb-4 text-slate-300" size={52} />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            No folders found
          </h3>
          <p className="text-slate-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "list"
              ? "flex flex-col gap-2"
              : "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }
        >
          {folders.map((folder) => (
            <FolderCard
              key={folder.name}
              {...folder}
              viewMode={viewMode}
              onColorChange={
                onFolderColorChange
                  ? (preset) => onFolderColorChange(folder.name, preset)
                  : undefined
              }
              onClick={() => onFolderClick && onFolderClick(folder)}
            />
          ))}
        </div>
      )}
    </>
  );
}