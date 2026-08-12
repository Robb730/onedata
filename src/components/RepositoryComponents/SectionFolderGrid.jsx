import { SectionFolderCard } from "./SectionFolderCard";

export function SectionFolderGrid({ folders = [], viewMode = "grid", onFolderClick, showCreateCard = true, onCreateSection }) {
  return (
    <div
      className={
        viewMode === "list"
          ? "flex flex-col gap-2"
          : "grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {folders.map((folder) => (
        <SectionFolderCard
          key={folder.name}
          {...folder}
          viewMode={viewMode}
          onClick={() => onFolderClick && onFolderClick(folder)}
        />
      ))}

      {showCreateCard && (
        <SectionFolderCard
          variant="create"
          viewMode={viewMode}
          onClick={onCreateSection}
        />
      )}
    </div>
  );
}
