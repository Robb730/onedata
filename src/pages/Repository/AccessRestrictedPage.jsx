import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Lock,
  Shield,
  CheckCircle,
  Clock,
  X,
  FolderLock,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import {
  createDivisionAccessRequest,
  fetchOwnDivisionRequest,
} from "../../utils/divisionAccessRequestsApi";
import { notifyScope } from "../../utils/notifications";
import { RepositorySectionHeader } from "../../components/RepositoryComponents";
import ModalPortal from "../../components/Modals/ModalPortal";

const roleDisplayMap = {
  administrator: "Administrator",
  division_focal: "Division Officer",
  section_focal: "Section Focal Officer",
  section_personnel: "Section Personnel",
};

const glassPanel =
  "rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl";
const glassStat =
  "rounded-2xl sm:rounded-[24px] border border-white/70 bg-white/85 p-3 sm:p-4 shadow-[0_14px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl min-w-0";

export default function AccessRestrictedPage() {
  const navigate = useNavigate();
  const { folderName } = useParams();
  const decodedName = decodeURIComponent(folderName || "");
  const { userProfile } = useUser();

  const [folderInfo, setFolderInfo] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ownContext, setOwnContext] = useState({
    divisionName: null,
    sectionName: null,
  });

  const [resolvedDivisionId, setResolvedDivisionId] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [existingRequest, setExistingRequest] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const roleLabel =
    roleDisplayMap[userProfile?.role] || userProfile?.role || "Unknown Role";

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
      setRequestMessage("");
      showSuccessToast();

      await logAuditEvent({
        action: "Other",
        fileName: displayName,
        details: `Requested access to "${displayName}"${
          requestMessage ? ` — Note: ${requestMessage}` : ""
        }`,
        role: userProfile?.role,
        status: "Success",
      });

      await notifyScope({
        divisionId: resolvedDivisionId,
        excludeUserId: userProfile?.id,
        type: "division_access_request",
        title: "Division access request",
        content: `${userProfile?.full_name} requested access to ${displayName}`,
        meta: { division_id: resolvedDivisionId },
      });
    } catch (err) {
      alert(err.message);
      await logAuditEvent({
        action: "Other",
        fileName: displayName,
        details: `Failed to request access to "${displayName}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function logAuditEvent({
    action,
    fileName,
    details,
    role,
    status = "Success",
  }) {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: fileName,
      details,
      performed_by: userProfile?.full_name ?? "System",
      role: roleDisplayMap[userProfile?.role] ?? userProfile?.role ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log insert failed:", error.message);
  }

  const status = existingRequest?.status;

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        <RepositorySectionHeader
          title={displayName}
          subtitle="This folder is outside your current access scope in the repository."
          onBack={() => navigate("/repository")}
          backLabel="Repository"
        />

        {/* Stats — same frosted pattern as division page */}
        <div className="mb-5 sm:mb-6 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className={glassStat}>
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Status
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-rose-600 truncate flex items-center gap-1.5">
              <Lock size={12} className="shrink-0" />
              Restricted
            </p>
          </div>

          <div className={glassStat}>
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Managed by
            </p>
            <p
              className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate"
              title={managerNames.join(", ")}
            >
              {loading
                ? "—"
                : managerNames.length
                  ? managerNames.join(", ")
                  : "Unassigned"}
            </p>
          </div>

          <div className={glassStat}>
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Your role
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {roleLabel}
            </p>
          </div>

          <div className={glassStat}>
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              {ownContext.sectionName ? "Your section" : "Contents"}
            </p>
            <p
              className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate"
              title={ownContextLabel || undefined}
            >
              {loading
                ? "—"
                : ownContextLabel ||
                  `${folderInfo?.fileCount ?? 0} ${(folderInfo?.fileCount ?? 0) === 1 ? "item" : "items"} · ${modifiedLabel}`}
            </p>
          </div>
        </div>

        {/* Main restricted panel */}
        <div className={`${glassPanel} px-4 sm:px-8 py-10 sm:py-14 lg:py-16`}>
          <div className="mx-auto max-w-lg flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/80">
              <FolderLock size={28} strokeWidth={1.75} />
            </div>

            <h2 className="text-[1.15rem] sm:text-[1.35rem] font-black text-slate-800 tracking-[-0.02em]">
              Access restricted
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
              You don&apos;t have permission to open this folder.
            </p>
            <p className="mt-2 text-[0.78rem] text-slate-400 font-medium leading-relaxed max-w-md">
              Your account ({roleLabel}
              {ownContextLabel ? ` · ${ownContextLabel}` : ""}) is not in the
              access path for this repository location. Request access from the
              division officer if you need it.
            </p>

            {/* Soft notice strip */}
            <div className="mt-6 w-full rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-3 flex items-start gap-2.5 text-left">
              <Shield size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[0.75rem] text-amber-800/90 font-medium leading-relaxed">
                Folder contents stay hidden until access is approved. Pending
                requests are reviewed by the assigned division focal.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-7 w-full flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate("/repository")}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={15} />
                Back to Repository
              </button>

              {status === "pending" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-100 px-5 py-2.5 text-sm font-semibold text-amber-700 cursor-not-allowed"
                >
                  <Clock size={15} />
                  Request pending
                </button>
              ) : status === "approved" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                >
                  <CheckCircle size={15} />
                  Access approved
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    resolvedDivisionId
                      ? setRequestOpen(true)
                      : navigate("/repository")
                  }
                  disabled={checkingExisting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  <Lock size={15} />
                  {status === "denied" ? "Request again" : "Request access"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request modal — bottom sheet mobile / centered desktop */}
      {requestOpen && (
        <ModalPortal>
        <div
          className="modal-overlay fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4"
          onClick={() => !submitting && setRequestOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-[0_24px_70px_rgba(15,23,42,0.18)] border border-slate-200 border-b-0 lg:border-b overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lg:hidden flex justify-center pt-2.5">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="min-w-0">
                <h3 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">
                  Request access
                </h3>
                <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
                  {displayName} — sent to the division focal for review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                disabled={submitting}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4">
              <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Note (optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value.slice(0, 200))}
                rows={3}
                maxLength={200}
                placeholder="Why do you need access to this folder?"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-none transition-all"
              />
              <p className="mt-1.5 text-[0.7rem] text-slate-400 text-right font-medium">
                {requestMessage.length}/200
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 px-4 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:pb-6">
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 shadow-sm shadow-blue-600/20"
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Success toast */}
      <div
        className={`fixed left-4 right-4 z-50 flex bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-8 sm:left-auto sm:right-8 sm:w-[380px] ${
          showToast
            ? "translate-y-0 sm:translate-x-0 opacity-100 pointer-events-auto"
            : "translate-y-4 sm:translate-y-0 sm:translate-x-[120%] opacity-0 pointer-events-none"
        }`}
        style={{
          minHeight: "76px",
          borderRadius: "16px",
          boxShadow: showToast
            ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
            : "0 12px 30px rgba(0,0,0,0)",
          border: "1px solid rgba(241, 245, 249, 1)",
        }}
      >
        <div className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r from-emerald-100/60 to-transparent" />
        <div className="flex items-center relative z-10 flex-1 px-5 gap-4 min-h-[76px]">
          <div className="flex h-[42px] w-[42px] items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center flex-1 pr-8">
            <p className="text-[15px] font-bold text-slate-900 leading-tight m-0">
              Success
            </p>
            <p className="text-[13px] font-medium text-slate-500 m-0 mt-0.5">
              Access request sent successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            aria-label="Close notification"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
