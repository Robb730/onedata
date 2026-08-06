import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShieldX,
  Lock,
  User,
  Shield,
  CheckCircle,
  Users,
  Clock,
  Building2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import {
  createDivisionAccessRequest,
  fetchOwnDivisionRequest,
} from "../../utils/divisionAccessRequestsApi";

const roleDisplayMap = {
  administrator: "Administrator",
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

  // the current user's own division/section names (for the "Your Role" card)
  const [ownContext, setOwnContext] = useState({
    divisionName: null,
    sectionName: null,
  });

  // track the resolved division id + a small request modal
  const [resolvedDivisionId, setResolvedDivisionId] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [existingRequest, setExistingRequest] = useState(null); // { id, status, deny_reason, created_at } | null
  const [checkingExisting, setCheckingExisting] = useState(false);

  const roleLabel =
    roleDisplayMap[userProfile?.role] || userProfile?.role || "Unknown Role";

  // ── Resolve the current user's own division / section name ──────
  useEffect(() => {
    if (!userProfile) return;

    let cancelled = false;

    async function resolveOwnContext() {
      let divisionName = null;
      let sectionName = null;

      if (userProfile.section_id != null) {
        const { data, error } = await supabase
          .from("sections")
          .select("name, division_id, divisions(name)")
          .eq("id", userProfile.section_id)
          .single();
        if (!error && data) {
          sectionName = data.name;
          divisionName = data.divisions?.name ?? divisionName;
        }
      }

      if (!divisionName && userProfile.division_id != null) {
        const { data, error } = await supabase
          .from("divisions")
          .select("name")
          .eq("id", userProfile.division_id)
          .single();
        if (!error && data) divisionName = data.name;
      }

      if (!cancelled) setOwnContext({ divisionName, sectionName });
    }

    resolveOwnContext();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.section_id, userProfile?.division_id]);

  useEffect(() => {
    if (resolvedDivisionId == null || !userProfile?.id) return;

    let cancelled = false;
    setCheckingExisting(true);
    fetchOwnDivisionRequest(userProfile.id, resolvedDivisionId)
      .then((req) => {
        if (!cancelled) setExistingRequest(req);
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedDivisionId, userProfile?.id]);

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
          .select("id, name, created_at")
          .eq("id", decodedName)
          .single();

        if (!divisionError && division) {
          name = division.name;
          divisionId = division.id;
          modifiedAt = division.created_at;
        } else if (divisionError) {
          console.error(
            "Division fetch failed:",
            divisionError.message,
            divisionError.code,
          );
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
      setResolvedDivisionId(divisionId);

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

  const managerNames = managers.map((m) => m.full_name || m.email);

  const modifiedLabel = folderInfo?.modifiedAt
    ? new Date(folderInfo.modifiedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // "Division Officer — IT Division" / "Section Personnel — Records Section"
  const ownContextLabel = ownContext.sectionName
    ? ownContext.sectionName
    : ownContext.divisionName
      ? ownContext.divisionName
      : null;

  async function handleSubmitRequest() {
    if (!resolvedDivisionId) return;
    setSubmitting(true);
    try {
      const req = await createDivisionAccessRequest({
        divisionId: resolvedDivisionId,
        userProfile,
        message: requestMessage,
      });
      setExistingRequest(req);
      setRequestOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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
        <button
          onClick={() => navigate("/repository")}
          className="hover:text-gray-700 transition-colors"
        >
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <Lock size={9} />
              Restricted Access
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={11} />
              {loading
                ? "…"
                : managerNames.length === 0
                  ? "Unassigned"
                  : managerNames.length === 1
                    ? managerNames[0]
                    : `${managerNames[0]} +${managerNames.length - 1} more`}
            </span>
            <span className="flex items-center gap-1">
              <span>Modified {loading ? "…" : modifiedLabel}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>{loading ? "…" : (folderInfo?.fileCount ?? 0)} files</span>
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

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          You don't have permission to view the contents of this folder.
        </p>
        <p className="text-xs text-gray-400 max-w-sm mb-8">
          Your current role ({roleLabel}
          {ownContextLabel ? ` · ${ownContextLabel}` : ""}) does not have
          access to this folder in the repository flow.
        </p>

        <div className="flex items-stretch gap-3 mb-8 flex-wrap justify-center">
          {/* Managed By — full list, wraps instead of truncating */}
          <div className="flex items-start gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 max-w-xs">
            <Users size={13} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">
                Managed By
              </p>
              {loading ? (
                <p className="text-sm font-semibold text-gray-800">—</p>
              ) : managerNames.length === 0 ? (
                <p className="text-sm font-semibold text-gray-800">
                  Unassigned
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {managerNames.map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-800"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Lock size={13} className="text-red-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Permission Level
              </p>
              <p className="text-sm font-semibold text-red-500">No Access</p>
            </div>
          </div>

          {/* Your Role — now also shows the user's own section/division */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Shield size={13} className="text-gray-400 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Your Role
              </p>
              <p className="text-sm font-semibold text-gray-800">{roleLabel}</p>
            </div>
          </div>

          {ownContextLabel && (
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
              <Building2 size={13} className="text-gray-400 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                  {ownContext.sectionName ? "Your Section" : "Your Division"}
                </p>
                <p
                  className="text-sm font-semibold text-gray-800 max-w-[180px] truncate"
                  title={ownContextLabel}
                >
                  {ownContextLabel}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/repository")}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          {(() => {
            const status = existingRequest?.status;
            if (status === "pending") {
              return (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg cursor-not-allowed"
                >
                  <Clock size={15} />
                  Request Pending
                </button>
              );
            }
            if (status === "approved") {
              return (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg cursor-not-allowed"
                >
                  <CheckCircle size={15} />
                  Access Approved
                </button>
              );
            }
            return (
              <button
                onClick={() =>
                  resolvedDivisionId
                    ? setRequestOpen(true)
                    : navigate("/repository")
                }
                disabled={checkingExisting}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-sm"
              >
                <CheckCircle size={15} />
                {status === "denied" ? "Request Again" : "Request Access"}
              </button>
            );
          })()}
        </div>
      </div>

      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Request access to {displayName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sent to the division focal person(s) for review. You'll be able to
              open this folder once approved.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
              placeholder="Add a note (optional) — why do you need access?"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRequestOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}