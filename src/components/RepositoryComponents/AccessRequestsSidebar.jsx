// AccessRequestsSidebar.jsx
// Opened via the floating button (see FloatingAccessRequestsButton.jsx) on
// the Repository folder detail page. Visible only to section_focal,
// division_focal, and admin — scope is enforced server-side in
// accessRequestsApi.fetchScopedRequests, this component just renders
// whatever comes back.
//
// UI note: when the same person has requested access to several files,
// their requests are grouped under a single "requester" card instead of
// repeating the avatar/name/role block once per file. This keeps the list
// scannable when one user requests a batch of files at once.

import { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  Check,
  Ban,
  Eye,
  Clock,
  Lock,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building2,
  Layers,
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
// Order requests within a requester's group so the things that need
// attention (pending) surface first, then most-recently-created.
const STATUS_ORDER = { pending: 0, approved: 1, denied: 2, revoked: 3 };
function sortRequests(list) {
  return [...list].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (s !== 0) return s;
    return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
  });
}

// Group requests by the person who made them (by requester id when we have
// one, falling back to their display name). Order of first appearance is
// preserved so the list doesn't jump around between renders.
function groupByRequester(list) {
  const order = [];
  const map = new Map();
  for (const r of list) {
    const key = r.requester_id ?? r.requester?.id ?? r.requested_by_name ?? r.id;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key).push(r);
  }
  return order.map((key) => sortRequests(map.get(key)));
}

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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
      style={{ animation: "arSidebarBackdropIn 180ms ease-out" }}
    >
      <style>{`
        @keyframes arSidebarBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes arSidebarModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.25)] border border-slate-200 overflow-hidden"
        style={{ animation: "arSidebarModalIn 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className={`w-11 h-11 rounded-xl ${copy.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 transition-colors">
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

// ── Requester identity block (avatar, name, role, home section) ───────
// Shared between the single-request card and the grouped card so both
// look consistent. `trailing` renders on the right (status badge for a
// single request, a file-count chip for a group).
function RequesterIdentity({ name, role, section, division, trailing }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-9 h-9 ${avatarColor(name)} rounded-full flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white`}>
          <span className="text-xs font-bold text-white">{initials(name)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800 leading-tight">{name}</p>
          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{getRoleDisplay(role)}</p>
          {(section || division) && (
            <p className="inline-flex items-start gap-1 text-[11px] text-slate-400 leading-snug mt-0.5">
              <Building2 size={11} className="shrink-0 mt-[1.5px]" />
              <span>
                {section}
                {section && division ? " · " : ""}
                {division}
              </span>
            </p>
          )}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// ── One file's request details + actions (used standalone or nested in
// a requester group) ────────────────────────────────────────────────
function FileEntry({ request, onApprove, onDeny, onRevoke, nested }) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  const file = request.files;
  const sectionName = request.sections?.name;
  const divisionName = request.sections?.divisions?.name;
  const status = request.status;
  const previewable = isPreviewableType(file?.type);

  async function handlePreview() {
    if (!file?.file_path || !previewable) return;
    setOpening(true);
    try {
      const bucket = getBucket(file.data_category);
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(file.file_path);
      if (error) throw new Error(error.message);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error(err);
      alert("Couldn't open the file: " + err.message);
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className={nested ? "py-3 first:pt-0 last:pb-0" : ""}>
      {/* File + status */}
      <div className="flex items-center gap-2">
        {previewable ? (
          <button
            onClick={handlePreview}
            disabled={opening}
            className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-100 transition-colors text-left disabled:opacity-60"
          >
            <FileText size={14} className="text-slate-400 shrink-0" />
            <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-700 truncate">
              {file?.file_name ?? "Unknown file"}
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <Eye size={12} />
              {opening ? "Opening…" : "Preview"}
            </span>
          </button>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50">
            <FileText size={14} className="text-slate-400 shrink-0" />
            <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-700 truncate">
              {file?.file_name ?? "Unknown file"}
            </span>
            {file?.type && (
              <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {file.type}
              </span>
            )}
          </div>
        )}
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
        >
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {(sectionName || divisionName) && (
        <p className="text-[10px] text-slate-400 mt-2">
          Requesting access under {sectionName ?? "—"}
          {divisionName ? ` · ${divisionName}` : ""}
        </p>
      )}

      {/* Reason */}
      <div className="flex items-center justify-between mt-2">
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
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold transition-colors shadow-sm"
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
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 text-[12px] font-bold transition-colors"
        >
          <Lock size={13} /> Revoke Access
        </button>
      )}
    </div>
  );
}

// ── Single-file requester card (no grouping needed) ────────────────
function RequestCard({ request, onApprove, onDeny, onRevoke }) {
  const requester = request.requester;
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300/80 transition-all duration-150">
      <div className="mb-3">
        <RequesterIdentity
          name={request.requested_by_name}
          role={requester?.role}
          section={requester?.sections?.name}
          division={requester?.divisions?.name}
        />
      </div>
      <FileEntry request={request} onApprove={onApprove} onDeny={onDeny} onRevoke={onRevoke} />
    </div>
  );
}

// ── Grouped card: one requester, multiple file requests ────────────
// Collapsed by default once nothing in the group is pending, so a batch
// that's already been fully reviewed doesn't eat up scroll space; groups
// with anything awaiting review start open. The whole header toggles it.
function RequesterGroupCard({ requests, onApprove, onDeny, onRevoke }) {
  const first = requests[0];
  const requester = first.requester;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const [collapsed, setCollapsed] = useState(pendingCount === 0);

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300/80 transition-all duration-150 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        className="w-full text-left p-4 pb-3 hover:bg-slate-50/70 transition-colors"
      >
        <RequesterIdentity
          name={first.requested_by_name}
          role={requester?.role}
          section={requester?.sections?.name}
          division={requester?.divisions?.name}
          trailing={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                <Layers size={11} />
                {requests.length} files
              </span>
              {collapsed ? (
                <ChevronDown size={15} className="text-slate-400" />
              ) : (
                <ChevronUp size={15} className="text-slate-400" />
              )}
            </div>
          }
        />
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600 mt-2">
            <Clock size={9} /> {pendingCount} awaiting review
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 divide-y divide-slate-100 border-t border-slate-100">
          {requests.map((r) => (
            <FileEntry key={r.id} request={r} onApprove={onApprove} onDeny={onDeny} onRevoke={onRevoke} nested />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main sidebar ────────────────────────────────────────────────────
const SIDEBAR_TRANSITION_MS = 280;

export default function AccessRequestsSidebar({ isOpen, onClose, userProfile }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | all | granted
  const [confirmState, setConfirmState] = useState(null); // { kind, request }
  const [isWorking, setIsWorking] = useState(false);

  // Keep the sidebar mounted for the duration of the closing animation, and
  // flip `entered` a tick after mount so the initial (off-screen) styles are
  // committed before we transition to the open state.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let timeout;
    if (isOpen) {
      setShouldRender(true);
      setEntered(true);
    } else {
      setEntered(false);
      timeout = setTimeout(() => setShouldRender(false), SIDEBAR_TRANSITION_MS);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen]);

  function handleClose() {
    // Let the caller flip isOpen false; the effect above handles the
    // animated unmount. Guard against double-invocation while animating.
    onClose();
  }

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
  const groups = useMemo(() => groupByRequester(visible), [visible]);

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

  if (!shouldRender) return null;

  return (
    <>
      <style>{`
        @keyframes arSidebarBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes arSidebarBackdropOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes arSidebarSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes arSidebarSlideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>

      {/* Backdrop (click to close, doesn't dim the page like a modal would) */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[1px]"
        style={{
          animation: entered
            ? "arSidebarBackdropIn 280ms ease-out forwards"
            : `arSidebarBackdropOut ${SIDEBAR_TRANSITION_MS}ms ease-in forwards`,
        }}
        onClick={handleClose}
      />

      <aside
        className="fixed top-0 right-0 z-50 h-screen w-full max-w-[440px] bg-white border-l border-slate-200 shadow-[0_0_60px_rgba(15,23,42,0.15)] flex flex-col will-change-transform"
        style={{
          animation: entered
            ? "arSidebarSlideIn 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : `arSidebarSlideOut ${SIDEBAR_TRANSITION_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards`,
        }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-blue-600 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-slate-100 shrink-0 bg-gradient-to-b from-slate-50/80 to-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative w-[52px] h-[52px] rounded-2xl bg-white shadow-[0_8px_24px_rgba(37,99,235,0.12)] border border-blue-50 flex items-center justify-center shrink-0">
              {/* Inner glow behind the animated icon */}
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              
              {/* Lordicon Animated Icon */}
              <lord-icon
                src="/wired-outline-966-file-policy-in-reveal.json"
                trigger="in"
                delay="100"
                stroke="bold"
                state="in-reveal"
                colors="primary:#2563eb,secondary:#2563eb"
                style={{ width: "36px", height: "36px", zIndex: 1 }}
              ></lord-icon>
            </div>
            <div>
              <h2 className="text-[1.15rem] font-black text-slate-800 tracking-[-0.02em] leading-tight drop-shadow-sm">
                Access Requests
              </h2>
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">
                  <Clock size={10} /> {pending.length} awaiting review
                </span>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="relative z-10 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 shrink-0">
          {[
            { key: "pending", label: "Pending", count: pending.length },
            { key: "all", label: "All", count: requests.length },
            { key: "granted", label: "Granted", count: granted.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold transition-colors ${
                tab === t.key
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  tab === t.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="h-px bg-slate-100 mx-5 mt-3 shrink-0" />

        {/* Info banner */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50/70 border border-blue-100 px-3.5 py-2.5">
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
            groups.map((group) =>
              group.length > 1 ? (
                <RequesterGroupCard
                  key={group[0].requester_id ?? group[0].requester?.id ?? group[0].requested_by_name}
                  requests={group}
                  onApprove={(req) => setConfirmState({ kind: "approve", request: req })}
                  onDeny={(req) => setConfirmState({ kind: "deny", request: req })}
                  onRevoke={(req) => setConfirmState({ kind: "revoke", request: req })}
                />
              ) : (
                <RequestCard
                  key={group[0].id}
                  request={group[0]}
                  onApprove={(req) => setConfirmState({ kind: "approve", request: req })}
                  onDeny={(req) => setConfirmState({ kind: "deny", request: req })}
                  onRevoke={(req) => setConfirmState({ kind: "revoke", request: req })}
                />
              ),
            )
          )}
        </div>

        {/* Footer progress */}
        {requests.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>{reviewedCount} of {requests.length} reviewed</span>
              <span>{reviewedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
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