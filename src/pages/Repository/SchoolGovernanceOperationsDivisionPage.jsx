import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.jsx";
import {
  RepositorySectionHeader,
  SectionFolderGrid,
} from "../../components/RepositoryComponents";
import { SCHOOL_GOVERNANCE_AND_OPERATIONS_FOLDERS } from "../../constants/repositoryFolders";

export default function SchoolGovernanceOperationsDivisionPage() {
  const navigate = useNavigate();
  const { userProfile } = useUser();
  const currentRole = userProfile?.role || localStorage.getItem("role") || "";

  return (
    <div className="p-8">
      <RepositorySectionHeader
        title="School Governance and Operations Division"
        subtitle="Browse the section folders that support school governance, operations, and learner services."
        onBack={() => navigate("/repository")}
      />

      <SectionFolderGrid
        folders={SCHOOL_GOVERNANCE_AND_OPERATIONS_FOLDERS}
        showCreateCard={currentRole === "admin" || currentRole === "division"}
        onFolderClick={(folder) => navigate(`/repository/sections/sgod/${encodeURIComponent(folder.name)}`)}
        onCreateSection={() => navigate("/repository/sections/sgod")}
      />
    </div>
  );
}
