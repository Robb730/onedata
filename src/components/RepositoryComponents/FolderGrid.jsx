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
  onFolderClick,
  onFolderColorChange,
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{folders.length}</span> folders
        </p>
      </div>

      {folders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No folders found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <FolderCard
              key={folder.name}
              {...folder}
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
