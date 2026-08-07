// DivisionAccessRequestsSidebar.jsx
// Opened via FloatingDivisionAccessRequestsButton on RepositoryDivisionPage.
// Visible only to division_focal (own division) and admin. Approving here
// only grants entry into the division folder view — it does not touch
// section-level or file-level permissions, which still go through
// AccessRequestsSidebar.

import { useEffect, useMemo, useState } from "react";
import { X, Users, ShieldCheck, Check, Ban, Lock, Clock, Building2, AlertCircle } from "lucide-react";
import {
  fetchScopedDivisionRequests,
  approveDivisionRequest,
  denyDivisionRequest,
  revokeDivisionAccess,
} from "../../utils/divisionAccessRequestsApi";

const roleDisplayMap = {
  division_focal: "Division Focal Person",
  section_focal: "Section Focal Person",
  section_personnel: "Section Personnel",
  admin: "Administrator",
};
const getRoleDisplay = (role) => roleDisplayMap[role] ?? role ?? "—";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  denied: "bg-red-50 text-red-600 border-red-200",
  revoked: "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_LABEL = { pending: "Pending", approved: "Approved", denied: "Denied", revoked: "Revoked" };
const STATUS_ORDER = { pending: 0, approved: 1, denied: 2, revoked: 3 };

function sortRequests(list) {
  return [...list].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (s !== 0) return s;
    return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
  });
}

function ActionConfirmModal({ open, kind, request, onClose, onConfirm, isWorking }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open, request?.id]);

  if (!open || !request) return null;

  const divisionName = request.divisions?.name ?? "this division";
  const copy = {
    approve: {
      title: "Approve this request?",
      icon: <Check size={20} className="text-white" />,
      iconBg: "bg-emerald-600",
      body: `${request.requested_by_name} will be able to open the "${divisionName}" folder. This does not grant access to individual files — section and file requests are still reviewed separately.`,
      confirmLabel: "Approve",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700",
    },
    deny: {
      title: "Deny this request?",
      icon: <Ban size={20} className="text-white" />,
      iconBg: "bg-red-600",
      body: `${request.requested_by_name} will not be granted entry to "${divisionName}". They can submit a new request at any time.`,
      confirmLabel: "Deny",
      confirmClass: "bg-red-600 hover:bg-red-700",
    },
    revoke: {
      title: "Revoke this access?",
      icon: <Lock size={20} className="text-white" />,
      iconBg: "bg-slate-700",
      body: `${request.requested_by_name} will immediately lose entry to "${divisionName}".`,
      confirmLabel: "Revoke",
      confirmClass: "bg-slate-700 hover:bg-slate-800",
    },
  }[kind];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.25)] border border-slate-200 overflow-hidden">
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className={`w-11 h-11 rounded-xl ${copy.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            {copy.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">{copy.title}</h2>
            <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">This action will be audit-logged</p>
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
              placeholder="e.g. This division's folder is limited to its own personnel"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 resize-none"
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

function RequestCard({ request, onApprove, onDeny, onRevoke }) {
  const requester = request.requester;
  const status = request.status;
  const [reasonOpen, setReasonOpen] = useState(false);

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300/80 transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 ${avatarColor(request.requested_by_name)} rounded-full flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white`}>
            <span className="text-xs font-bold text-white">{initials(request.requested_by_name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800 leading-tight">{request.requested_by_name}</p>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{getRoleDisplay(requester?.role)}</p>
            {requester?.sections?.name && (
              <p className="inline-flex items-start gap-1 text-[11px] text-slate-400 leading-snug mt-0.5">
                <Building2 size={11} className="shrink-0 mt-[1.5px]" />
                <span>{requester.sections.name}</span>
              </p>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-slate-400">{formatDate(request.created_at)}</span>
        {request.message && (
          <button
            onClick={() => setReasonOpen((v) => !v)}
            className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
          >
            {reasonOpen ? "Hide note" : "View note"}
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

const SIDEBAR_TRANSITION_MS = 280;

export default function DivisionAccessRequestsSidebar({ isOpen, onClose, userProfile }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [confirmState, setConfirmState] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

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
    return () => timeout && clearTimeout(timeout);
  }, [isOpen]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchScopedDivisionRequests(userProfile);
      setRequests(sortRequests(data));
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
  const reviewedCount = useMemo(() => requests.filter((r) => r.status !== "pending").length, [requests]);
  const reviewedPct = requests.length ? Math.round((reviewedCount / requests.length) * 100) : 0;

  const visible = tab === "pending" ? pending : tab === "granted" ? granted : requests;

  async function handleConfirm(reason) {
    if (!confirmState) return;
    const { kind, request } = confirmState;
    setIsWorking(true);
    try {
      if (kind === "approve") await approveDivisionRequest(request, userProfile);
      if (kind === "deny") await denyDivisionRequest(request, userProfile, reason);
      if (kind === "revoke") await revokeDivisionAccess(request, userProfile);
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
        @keyframes davSidebarBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes davSidebarBackdropOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes davSidebarSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes davSidebarSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
      `}</style>

      <div
        className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[1px]"
        style={{
          animation: entered
            ? "davSidebarBackdropIn 280ms ease-out forwards"
            : `davSidebarBackdropOut ${SIDEBAR_TRANSITION_MS}ms ease-in forwards`,
        }}
        onClick={onClose}
      />

      <aside
        className="fixed top-0 right-0 z-50 h-screen w-full max-w-[440px] bg-white border-l border-slate-200 shadow-[0_0_60px_rgba(15,23,42,0.15)] flex flex-col will-change-transform"
        style={{
          animation: entered
            ? "davSidebarSlideIn 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : `davSidebarSlideOut ${SIDEBAR_TRANSITION_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards`,
        }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shrink-0" />

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <Users size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[0.95rem] font-black text-slate-800 tracking-[-0.01em] leading-tight">
                Division Access Requests
              </h2>
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600 mt-0.5">
                  <Clock size={9} /> {pending.length} awaiting review
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

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
                tab === t.key ? "bg-violet-50 text-violet-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  tab === t.key ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="h-px bg-slate-100 mx-5 mt-3 shrink-0" />

        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-start gap-2 rounded-xl bg-violet-50/70 border border-violet-100 px-3.5 py-2.5">
            <ShieldCheck size={13} className="text-violet-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Approving only lets the requester open this division's folder. It does not
              grant access to sections or files inside it — those are reviewed separately.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              Loading requests…
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16">
              <Users className="mx-auto text-slate-300 mb-2" size={28} />
              <p className="text-[13px] font-semibold text-slate-500">
                {tab === "pending" ? "No pending requests" : tab === "granted" ? "No one has been granted entry yet" : "No requests yet"}
              </p>
            </div>
          ) : (
            visible.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={(req) => setConfirmState({ kind: "approve", request: req })}
                onDeny={(req) => setConfirmState({ kind: "deny", request: req })}
                onRevoke={(req) => setConfirmState({ kind: "revoke", request: req })}
              />
            ))
          )}
        </div>

        {requests.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>{reviewedCount} of {requests.length} reviewed</span>
              <span>{reviewedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
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