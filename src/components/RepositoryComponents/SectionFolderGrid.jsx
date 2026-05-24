import { SectionFolderCard } from "./SectionFolderCard";

export function SectionFolderGrid({ folders = [], onFolderClick, showCreateCard = true, onCreateSection }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {folders.map((folder) => (
        <SectionFolderCard
          key={folder.name}
          {...folder}
          onClick={() => onFolderClick && onFolderClick(folder)}
        />
      ))}

      {showCreateCard && (
        <SectionFolderCard
          variant="create"
          onClick={onCreateSection}
        />
      )}
    </div>
  );
}
