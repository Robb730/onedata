import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldX, Lock, User, Shield, CheckCircle, Users } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";

const roleDisplayMap = {
  admin: "Administrator",
  division_focal: "Division Officer",
  section_focal: "Section Focal Officer",
  section_personnel: "Section Personnel",
};

export default function AccessRestrictedPage() {
  const navigate = useNavigate();
  const { folderName } = useParams();
  const decodedName = decodeURIComponent(folderName || "");
  const { userProfile } = useUser();

  const [folderInfo, setFolderInfo] = useState(null); // { name, fileCount, modifiedAt }
  const [managers, setManagers] = useState([]); // all division_focal users for this division
  const [loading, setLoading] = useState(true);

  const roleLabel =
    roleDisplayMap[userProfile?.role] || userProfile?.role || "Unknown Role";

  useEffect(() => {
    if (!decodedName) return;

    async function resolveFolder() {
      setLoading(true);

      // The restricted route is reached two different ways:
      //  - RepositoryDivisionPage redirects with a division id (numeric string)
      //  - RepositoryFolderDetailPage redirects with a section name
      const isDivisionId = /^\d+$/.test(decodedName);

      let name = decodedName;
      let divisionId = null;
      let fileCount = 0;
      let modifiedAt = null;

      if (isDivisionId) {
        const { data: division, error: divisionError } = await supabase
          .from("divisions")
          .select("id, name, created_at, updated_at")
          .eq("id", decodedName)
          .single();

        if (!divisionError && division) {
          name = division.name;
          divisionId = division.id;
          modifiedAt = division.updated_at || division.created_at;
        }

        const { count } = await supabase
          .from("sections")
          .select("id", { count: "exact", head: true })
          .eq("division_id", decodedName);
        fileCount = count || 0;
      } else {
        const { data: section, error: sectionError } = await supabase
          .from("sections")
          .select("id, name, division_id, created_at, updated_at")
          .eq("name", decodedName)
          .single();

        if (!sectionError && section) {
          name = section.name;
          divisionId = section.division_id;
          modifiedAt = section.updated_at || section.created_at;

          const { count } = await supabase
            .from("files")
            .select("id", { count: "exact", head: true })
            .eq("section_id", section.id);
          fileCount = count || 0;
        }
      }

      setFolderInfo({ name, fileCount, modifiedAt });

      if (divisionId != null) {
        const { data: focals, error: focalsError } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("role", "division_focal")
          .eq("division_id", divisionId);

        if (!focalsError) setManagers(focals || []);
      } else {
        setManagers([]);
      }

      setLoading(false);
    }

    resolveFolder();
  }, [decodedName]);

  const displayName = loading
    ? "Loading…"
    : folderInfo?.name || decodedName || "Restricted Folder";

  const managedByLabel =
    managers.length === 0
      ? "Unassigned"
      : managers.map((m) => m.full_name || m.email).join(", ");

  const modifiedLabel = folderInfo?.modifiedAt
    ? new Date(folderInfo.modifiedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="text-gray-300">›</span>
        <button onClick={() => navigate("/repository")} className="hover:text-gray-700 transition-colors">
          Repository
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-gray-800 font-medium">{displayName}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ShieldX size={22} className="text-gray-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
            <Lock size={9} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <Lock size={9} />
              Restricted Access
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User size={11} />
              {loading ? "…" : managedByLabel}
            </span>
            <span className="flex items-center gap-1">
              <span>Modified {loading ? "…" : modifiedLabel}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>{loading ? "…" : folderInfo?.fileCount ?? 0} files</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <Shield size={36} className="text-red-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Lock size={14} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-500 mb-1">
          You don't have permission to view the contents of this folder.
        </p>
        <p className="text-xs text-gray-400 max-w-sm mb-8">
          Your current role ({roleLabel}) does not have access to this folder in the repository flow.
        </p>

        <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Users size={13} className="text-gray-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Managed By</p>
              <p className="text-sm font-semibold text-gray-800 max-w-[220px] truncate" title={managedByLabel}>
                {loading ? "—" : managedByLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Lock size={13} className="text-red-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Permission Level</p>
              <p className="text-sm font-semibold text-red-500">No Access</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Shield size={13} className="text-gray-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Your Role</p>
              <p className="text-sm font-semibold text-gray-800">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/repository")}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          <button
            onClick={() => navigate("/repository")}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-sm"
          >
            <CheckCircle size={15} />
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
}