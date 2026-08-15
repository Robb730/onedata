import { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Upload,
  Download,
  CheckCircle,
  Trash2,
  Edit,
  Shield,
  FileText,
  Activity,
  UserPlus,
  RefreshCcw,
  XCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ModalPortal from "../Modals/ModalPortal";

// ─── Static config: one source of truth per action type ─────────
const ACTION_META = {
  Upload: { icon: Upload, color: "blue", label: "Upload" },
  Download: { icon: Download, color: "teal", label: "Download" },
  Verify: { icon: CheckCircle, color: "green", label: "Verify" },
  Edit: { icon: Edit, color: "orange", label: "Edit" },
  Delete: { icon: Trash2, color: "red", label: "Delete" },
  "Role Change": { icon: RefreshCcw, color: "purple", label: "Role Change" },
  "Access Grant": { icon: UserPlus, color: "blue", label: "Access Grant" },
  "Access Request": { icon: Shield, color: "yellow", label: "Access Request" },
};
const DEFAULT_META = { icon: Activity, color: "slate", label: "Other" };

const COLOR_CLASSES = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", solid: "bg-blue-500", ring: "ring-blue-100" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", solid: "bg-teal-500", ring: "ring-teal-100" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", solid: "bg-green-500", ring: "ring-green-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", solid: "bg-orange-500", ring: "ring-orange-100" },
  red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", solid: "bg-red-500", ring: "ring-red-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", solid: "bg-purple-500", ring: "ring-purple-100" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-100", solid: "bg-yellow-500", ring: "ring-yellow-100" },
  slate: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", solid: "bg-slate-400", ring: "ring-slate-100" },
};

const getActionMeta = (action) => ACTION_META[action] ?? DEFAULT_META;

const STATUS_META = {
  Success: { dot: "bg-emerald-500", text: "text-emerald-600" },
  Failed: { dot: "bg-red-500", text: "text-red-600" },
  Pending: { dot: "bg-amber-500", text: "text-amber-600" },
};

// ─── Time helpers ─────────────────────────────────────────────
function getRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return null; // fall back to date grouping label
}

function formatClock(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getDateGroupLabel(date) {
  const now = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function UserLogsModal({ isOpen, onClose, user }) {
  const [filterAction, setFilterAction] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ─── Fetch actions THIS user performed (not actions done to them) ──
  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;

    async function fetchUserLogs() {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("performed_by", user.name)
        .order("performed_on", { ascending: false })
        .limit(150);

      if (error) {
        console.error("Failed to fetch user logs:", error.message);
        if (isMounted) {
          setErrorMsg("Could not load activity logs.");
          setLogs([]);
        }
      } else if (isMounted) {
        setLogs(data.map(mapRow));
      }
      if (isMounted) setLoading(false);
    }

    function mapRow(row) {
      const date = row.performed_on ? new Date(row.performed_on) : null;
      return {
        id: row.id,
        action: row.action,
        fileName: row.file_name ?? null,
        details: row.details ?? "",
        role: row.role,
        status: row.status,
        date: date && !isNaN(date.getTime()) ? date : null,
      };
    }

    fetchUserLogs();

    const channel = supabase
      .channel(`user_logs_${user.id ?? user.name}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const row = payload.new;
          if (row.performed_by !== user.name) return;
          setLogs((prev) => [mapRow(row), ...prev]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

  // ─── Derived data ───────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = filterAction === "All" || log.action === filterAction;
      const matchesSearch =
        !q ||
        log.fileName?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q);
      return matchesAction && matchesSearch;
    });
  }, [logs, filterAction, searchQuery]);

  const groupedLogs = useMemo(() => {
    const groups = [];
    let currentLabel = null;
    let currentItems = null;
    for (const log of filteredLogs) {
      const label = log.date ? getDateGroupLabel(log.date) : "Unknown date";
      if (label !== currentLabel) {
        currentLabel = label;
        currentItems = [];
        groups.push({ label, items: currentItems });
      }
      currentItems.push(log);
    }
    return groups;
  }, [filteredLogs]);

  const totalActions = logs.length;
  const topActionCounts = useMemo(() => {
    const counts = {};
    for (const log of logs) counts[log.action] = (counts[log.action] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [logs]);

  const lastActive = logs[0]?.date ?? null;

  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div
      className="modal-overlay fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.15)] w-full max-w-3xl max-h-[calc(100dvh-3.5rem)] lg:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 border-b-0 lg:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white shrink-0 gap-3">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight truncate">
                {user.name}&apos;s Activity
              </h2>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[0.65rem] font-bold">
                  {user.role}
                </span>
                <span className="text-[0.72rem] font-medium text-slate-400 truncate">
                  {user.division}
                </span>
                {lastActive && (
                  <span className="text-[0.68rem] font-medium text-slate-400">
                    · Last active {getRelativeTime(lastActive) ?? getDateGroupLabel(lastActive)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quick-filter chips — click to toggle, doubles as the stat summary */}
        {!loading && !errorMsg && totalActions > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={filterAction === "All"}
              onClick={() => setFilterAction("All")}
              icon={Activity}
              label="All"
              count={totalActions}
              color="slate"
            />
            {topActionCounts.map(([action, count]) => {
              const meta = getActionMeta(action);
              return (
                <FilterChip
                  key={action}
                  active={filterAction === action}
                  onClick={() => setFilterAction(filterAction === action ? "All" : action)}
                  icon={meta.icon}
                  label={meta.label}
                  count={count}
                  color={meta.color}
                />
              );
            })}
          </div>
        )}

        {/* Search */}
        {!loading && !errorMsg && totalActions > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search this activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[40px] rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2 text-[0.82rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.7rem] font-semibold text-slate-400">
                {filteredLogs.length} of {totalActions}
              </span>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="flex-1 overflow-auto bg-white min-h-0">
          {loading ? (
            <LoadingSkeleton />
          ) : errorMsg ? (
            <EmptyState
              icon={XCircle}
              iconClass="bg-red-50 text-red-400 border-red-100"
              title={errorMsg}
            />
          ) : totalActions === 0 ? (
            <EmptyState
              icon={Inbox}
              iconClass="bg-slate-100 text-slate-400 border-slate-200"
              title="No activity yet"
              subtitle={`${user.name} hasn't performed any tracked actions.`}
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={Search}
              iconClass="bg-slate-100 text-slate-400 border-slate-200"
              title="No matching activity"
              subtitle="Try a different search term or filter."
            />
          ) : (
            <div className="px-4 sm:px-6 py-4 space-y-6">
              {groupedLogs.map((group) => (
                <div key={group.label}>
                  <p className="sticky top-0 z-[1] -mx-4 sm:-mx-6 px-4 sm:px-6 py-1.5 mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 bg-white/95 backdrop-blur-sm">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((log) => (
                      <LogEntry key={log.id} log={log} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-3.5 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-slate-900 text-white rounded-[10px] hover:bg-slate-800 hover:shadow-md font-bold text-[0.85rem] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────

function FilterChip({ active, onClick, icon: Icon, label, count, color }) {
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.slate;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-bold transition-all ${
        active
          ? `${c.solid} text-white border-transparent shadow-sm`
          : `bg-white ${c.text} ${c.border} hover:bg-slate-50`
      }`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {label}
      <span
        className={`ml-0.5 rounded-full px-1.5 py-[1px] text-[0.68rem] ${
          active ? "bg-white/25" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function LogEntry({ log }) {
  const meta = getActionMeta(log.action);
  const c = COLOR_CLASSES[meta.color] ?? COLOR_CLASSES.slate;
  const Icon = meta.icon;
  const statusMeta = STATUS_META[log.status];
  const relative = log.date ? getRelativeTime(log.date) : null;

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 hover:bg-slate-50/60 hover:shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.bg} ${c.text} border ${c.border}`}
      >
        <Icon size={15} strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[0.85rem] font-bold text-slate-800 leading-snug truncate">
            {log.fileName ?? meta.label}
          </p>
          <div className="shrink-0 text-right">
            <p className="text-[0.72rem] font-semibold text-slate-500 whitespace-nowrap">
              {relative ?? (log.date ? formatClock(log.date) : "—")}
            </p>
          </div>
        </div>

        {log.details && (
          <p className="mt-0.5 text-[0.78rem] text-slate-500 leading-snug line-clamp-2">
            {log.details}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] font-bold ${c.bg} ${c.text}`}>
            {meta.label}
          </span>
          {statusMeta && (
            <span className={`inline-flex items-center gap-1 text-[0.7rem] font-semibold ${statusMeta.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {log.status}
            </span>
          )}
          {log.date && (
            <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-slate-400">
              <Clock size={10} />
              {formatClock(log.date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, iconClass, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-4 text-center">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${iconClass}`}>
        <Icon size={24} />
      </div>
      <p className="text-slate-700 font-bold text-[0.9rem]">{title}</p>
      {subtitle && <p className="text-[0.8rem] text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-100" />
            <div className="h-2.5 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="h-2.5 w-10 rounded bg-slate-100 shrink-0" />
        </div>
      ))}
    </div>
  );
}