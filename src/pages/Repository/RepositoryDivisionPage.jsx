import { useNavigate, useParams } from "react-router-dom";
import {
  RepositorySectionHeader,
  SectionFolderGrid,
} from "../../components/RepositoryComponents";
import {
  REPOSITORY_DIVISION_BY_SLUG,
  REPOSITORY_DIVISION_FOLDERS_BY_SLUG,
} from "../../constants/repositoryFolders";

export default function RepositoryDivisionPage() {
  const navigate = useNavigate();
  const { divisionSlug } = useParams();
  const division = REPOSITORY_DIVISION_BY_SLUG[divisionSlug] || REPOSITORY_DIVISION_BY_SLUG.sgod;
  const folders = REPOSITORY_DIVISION_FOLDERS_BY_SLUG[division.slug] || [];

  return (
    <div className="p-8 bg-linear-to-b from-slate-50 to-white min-h-screen">
      <RepositorySectionHeader
        title={division.name}
        subtitle={`Browse the section folders inside ${division.name}.`}
        onBack={() => navigate("/repository")}
        backLabel="Repository"
      />

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sections</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{folders.length} folders</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Owner</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{division.owner}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Updated</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{division.date}</p>
        </div>
      </div>

      <SectionFolderGrid
        folders={folders}
        showCreateCard
        onFolderClick={(folder) => navigate(`/repository/folder/${encodeURIComponent(folder.name)}`)}
        onCreateSection={() => navigate("/upload-files")}
      />
    </div>
  );
}
