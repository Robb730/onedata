// AccessRequestsSidebar.jsx
// Opened via the floating button (see FloatingAccessRequestsButton.jsx) on
// the Repository folder detail page. Visible only to section_focal,
// division_focal, and admin — scope is enforced server-side in
// accessRequestsApi.fetchScopedRequests, this component just renders
// whatever comes back.

import { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  Check,
  Ban,
  Download,
  Eye,
  Clock,
  Lock,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import {
  fetchScopedRequests,
  approveRequest,
  denyRequest,
  revokeAccess,
} from "../../utils/accessRequestsApi";

const roleDisplayMap = {
  division_focal: "Division Focal Person",
  section_focal: "Section Focal Person",
  section_personnel: "Section Personnel",
  admin: "Administrator",
};
const getRoleDisplay = (role) => roleDisplayMap[role] ?? role ?? "—";

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];
function hashStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
const avatarColor = (name) => AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
const initials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPreviewableType(type) {
  return type === "PDF" || type === "Image";
}

function getBucket(category) {
  return category === "general" || !category ? "repository-files" : "excel-files";
}

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  denied: "bg-red-50 text-red-600 border-red-200",
  revoked: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  revoked: "Revoked",
};

// ── Confirmation modal (Approve / Deny / Revoke) ───────────────────────
function ActionConfirmModal({ open, kind, request, onClose, onConfirm, isWorking }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open, request?.id]);

  if (!open || !request) return null;

  const copy = {
    approve: {
      title: "Approve this request?",
      icon: <Check size={20} className="text-white" />,
      iconBg: "bg-emerald-600",
      body: `${request.requested_by_name} will be granted permanent view & download access to "${request.files?.file_name}". They won't be able to edit or delete it. You can revoke this anytime from Manage Access.`,
      confirmLabel: "Approve",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700",
    },
    deny: {
      title: "Deny this request?",
      icon: <Ban size={20} className="text-white" />,
      iconBg: "bg-red-600",
      body: `${request.requested_by_name} will not be granted access to "${request.files?.file_name}". They'll be able to submit a new request at any time.`,
      confirmLabel: "Deny",
      confirmClass: "bg-red-600 hover:bg-red-700",
    },
    revoke: {
      title: "Revoke this access?",
      icon: <Lock size={20} className="text-white" />,
      iconBg: "bg-slate-700",
      body: `${request.requested_by_name} will immediately lose view & download access to "${request.files?.file_name}".`,
      confirmLabel: "Revoke",
      confirmClass: "bg-slate-700 hover:bg-slate-800",
    },
  }[kind];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200 overflow-hidden">
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className={`w-11 h-11 rounded-xl ${copy.iconBg} flex items-center justify-center shrink-0`}>
            {copy.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">
              {copy.title}
            </h2>
            <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
              This action will be audit-logged
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <p className="text-[13px] text-slate-600 leading-relaxed">{copy.body}</p>
        </div>

        {kind === "deny" && (
          <div className="px-6 pt-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Reason (optional, shown to requester)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 150))}
              rows={2}
              maxLength={150}
              placeholder="e.g. This file contains data outside your section's scope"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 px-6 py-6">
          <button
            onClick={onClose}
            disabled={isWorking}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(kind === "deny" ? reason : undefined)}
            disabled={isWorking}
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm ${copy.confirmClass}`}
          >
            {isWorking ? "Saving…" : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── One request card ────────────────────────────────────────────────
function RequestCard({ request, onApprove, onDeny, onRevoke }) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const file = request.files;
  const requester = request.requester;
  const sectionName = request.sections?.name;
  const divisionName = request.sections?.divisions?.name;
  const status = request.status;
  const previewable = isPreviewableType(file?.type);

  async function handlePreview() {
    if (!file?.file_path) return;
    setDownloading(true);
    try {
      const bucket = getBucket(file.data_category);
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(file.file_path);
      if (error) throw new Error(error.message);
      const url = URL.createObjectURL(blob);
      if (previewable) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error(err);
      alert("Couldn't open the file: " + err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {/* Requester */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 ${avatarColor(request.requested_by_name)} rounded-full flex items-center justify-center shrink-0`}>
            <span className="text-xs font-bold text-white">{initials(request.requested_by_name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
              {request.requested_by_name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {getRoleDisplay(requester?.role)}
              {requester?.sections?.name ? ` · ${requester.sections.name}` : ""}
              {requester?.divisions?.name ? ` · ${requester.divisions.name}` : ""}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
        >
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {/* File + requesting-for context (which section/division folder this lives in) */}
      <button
        onClick={handlePreview}
        disabled={downloading}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left disabled:opacity-60"
      >
        <FileText size={14} className="text-slate-400 shrink-0" />
        <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-700 truncate">
          {file?.file_name ?? "Unknown file"}
        </span>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
          {previewable ? <Eye size={12} /> : <Download size={12} />}
          {downloading ? "Opening…" : previewable ? "View Request" : "Download Request"}
        </span>
      </button>

      {(sectionName || divisionName) && (
        <p className="text-[10px] text-slate-400 mt-2">
          From {sectionName ?? "—"}
          {divisionName ? ` · ${divisionName}` : ""}
        </p>
      )}

      {/* Reason */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-slate-400">{formatDate(request.created_at)}</span>
        {request.message && (
          <button
            onClick={() => setReasonOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
          >
            View reason {reasonOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>
      {reasonOpen && request.message && (
        <p className="mt-2 text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed">
          {request.message}
        </p>
      )}

      {status === "denied" && request.deny_reason && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 leading-relaxed">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {request.deny_reason}
        </p>
      )}

      {/* Actions */}
      {status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onApprove(request)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold transition-colors"
          >
            <Check size={13} /> Approve
          </button>
          <button
            onClick={() => onDeny(request)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-bold transition-colors"
          >
            <X size={13} /> Deny
          </button>
        </div>
      )}
      {status === "approved" && (
        <button
          onClick={() => onRevoke(request)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12px] font-bold transition-colors"
        >
          <Lock size={13} /> Revoke Access
        </button>
      )}
    </div>
  );
}

// ── Main sidebar ────────────────────────────────────────────────────
export default function AccessRequestsSidebar({ isOpen, onClose, userProfile }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | all | granted
  const [confirmState, setConfirmState] = useState(null); // { kind, request }
  const [isWorking, setIsWorking] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchScopedRequests(userProfile);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const granted = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const reviewedCount = useMemo(
    () => requests.filter((r) => r.status !== "pending").length,
    [requests],
  );
  const reviewedPct = requests.length
    ? Math.round((reviewedCount / requests.length) * 100)
    : 0;

  const visible = tab === "pending" ? pending : tab === "granted" ? granted : requests;

  async function handleConfirm(reason) {
    if (!confirmState) return;
    const { kind, request } = confirmState;
    setIsWorking(true);
    try {
      if (kind === "approve") await approveRequest(request, userProfile);
      if (kind === "deny") await denyRequest(request, userProfile, reason);
      if (kind === "revoke") await revokeAccess(request, userProfile);
      setConfirmState(null);
      await load();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsWorking(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (click to close, doesn't dim the page like a modal would) */}
      <div className="fixed inset-0 z-40 bg-slate-950/10" onClick={onClose} />

      <aside className="fixed top-0 right-0 z-50 h-screen w-full max-w-[420px] bg-white border-l border-slate-200 shadow-[0_0_60px_rgba(15,23,42,0.15)] flex flex-col">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-700" />
            <h2 className="text-[0.95rem] font-black text-slate-800 tracking-[-0.01em]">
              Access Requests
            </h2>
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200">
                <Clock size={9} /> {pending.length} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 px-5 pt-3 border-b border-slate-100 shrink-0">
          {[
            { key: "pending", label: "Pending", count: pending.length },
            { key: "all", label: "All", count: requests.length },
            { key: "granted", label: "Granted", count: granted.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${
                tab === t.key
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {t.label} <span className="text-[11px] font-semibold">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-2.5">
            <ShieldCheck size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Approving grants the requester permanent view &amp; download access.
              Manage or revoke access anytime from the{" "}
              <button onClick={() => setTab("granted")} className="font-bold underline underline-offset-2">
                Granted
              </button>{" "}
              tab.
            </p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Loading requests…
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16">
              {tab === "granted" ? (
                <Users className="mx-auto text-slate-300 mb-2" size={28} />
              ) : (
                <ShieldCheck className="mx-auto text-slate-300 mb-2" size={28} />
              )}
              <p className="text-[13px] font-semibold text-slate-500">
                {tab === "pending"
                  ? "No pending requests"
                  : tab === "granted"
                    ? "No one has been granted access yet"
                    : "No requests yet"}
              </p>
            </div>
          ) : (
            visible.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onApprove={(req) => setConfirmState({ kind: "approve", request: req })}
                onDeny={(req) => setConfirmState({ kind: "deny", request: req })}
                onRevoke={(req) => setConfirmState({ kind: "revoke", request: req })}
              />
            ))
          )}
        </div>

        {/* Footer progress */}
        {requests.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>{reviewedCount} of {requests.length} reviewed</span>
              <span>{reviewedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${reviewedPct}%` }}
              />
            </div>
          </div>
        )}
      </aside>

      <ActionConfirmModal
        open={!!confirmState}
        kind={confirmState?.kind}
        request={confirmState?.request}
        onClose={() => !isWorking && setConfirmState(null)}
        onConfirm={handleConfirm}
        isWorking={isWorking}
      />
    </>
  );
}
