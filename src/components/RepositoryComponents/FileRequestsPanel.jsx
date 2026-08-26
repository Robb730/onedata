import { useEffect, useState } from "react";
import { X, FileText, Inbox, Calendar, User2, MessageSquareText, Paperclip, Eye } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

const AVATAR_COLORS = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500"];
function hashStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function getAvatarColor(name) { return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length]; }
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
function getStatusStyle(status) {
  if (status === "Overdue") return "text-red-600 bg-red-50 border-red-200";
  if (status === "Completed") return "text-teal-600 bg-teal-50 border-teal-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}
function getAccent(status) {
  if (status === "Overdue") return "bg-red-400";
  if (status === "Completed") return "bg-teal-400";
  return "bg-amber-400";
}

function getFileExt(url = "") {
  const clean = url.split("?")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

export default function FileRequestsPanel({ isOpen, onClose, requests = [], isLoading = false }) {
  // Keep the panel mounted while the exit animation plays.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let raf1, raf2, t2;
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      document.body.style.overflow = "";
      t2 = setTimeout(() => setShouldRender(false), 320);
    }
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (t2) clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const filtered =
    filter === "mine"
      ? requests.filter((r) => r.isOwnRequest)
      : filter === "pending"
        ? requests.filter((r) => r.status === "Pending")
        : filter === "overdue"
          ? requests.filter((r) => r.status === "Overdue")
          : filter === "completed"
            ? requests.filter((r) => r.status === "Completed")
            : requests;
  const mineCount = requests.filter((r) => r.isOwnRequest).length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const overdueCount = requests.filter((r) => r.status === "Overdue").length;
  const completedCount = requests.filter((r) => r.status === "Completed").length;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100]">
        <button
          type="button"
          className={`modal-overlay absolute inset-0 border-0 p-0 transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"
            }`}
          aria-label="Close"
          onClick={onClose}
        />
        <div
          className={`absolute z-10 bg-white flex flex-col shadow-[0_0_60px_rgba(15,23,42,0.18)]
          left-0 right-0 bottom-0 max-h-[92dvh] rounded-t-2xl
          lg:left-auto lg:top-0 lg:right-0 lg:h-dvh lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${animateIn
              ? "translate-y-0 lg:translate-x-0"
              : "translate-y-full lg:translate-y-0 lg:translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="lg:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="px-4 pt-2 pb-3 lg:px-6 lg:pt-6 lg:pb-4 border-b border-slate-100 shrink-0 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
                  <Inbox size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[1rem] lg:text-[1.1rem] font-black text-slate-800 tracking-[-0.01em] leading-tight">
                    Files Requested
                  </h2>
                  <p className="text-[0.72rem] text-slate-400 font-medium mt-0.5">
                    {requests.length} request{requests.length !== 1 ? "s" : ""} for this section
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter pills */}
            <div className="mt-4 flex items-center gap-1 p-1 rounded-full bg-slate-100/80 border border-slate-200/60 overflow-x-auto">
              {FILTERS.map((f, idx) => {
                const active = filter === f.key;
                const count =
                  f.key === "mine"
                    ? mineCount
                    : f.key === "pending"
                      ? pendingCount
                      : f.key === "overdue"
                        ? overdueCount
                        : f.key === "completed"
                          ? completedCount
                          : requests.length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      scrollSnapAlign: "start",
                      marginRight: idx === FILTERS.length - 1 ? "8px" : undefined,
                    }}
                    className={`inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all ${active
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {f.label}
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-blue-50 text-blue-600" : "bg-slate-200/70 text-slate-500"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 lg:py-5 space-y-3 bg-slate-50/30 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Loading requests…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                  <FileText className="text-slate-300" size={20} strokeWidth={1.5} />
                </div>
                  <p className="text-[0.85rem] font-semibold text-slate-500">
                    {filter === "mine"
                      ? "You haven't requested any files"
                      : filter === "pending"
                        ? "No pending requests"
                        : filter === "overdue"
                          ? "No overdue requests"
                          : filter === "completed"
                            ? "No completed requests"
                            : "No file requests yet"}
                  </p>
                  <p className="text-[0.75rem] text-slate-400 mt-0.5 max-w-[240px]">
                    {filter === "mine"
                      ? "Files you request will show up here."
                      : filter === "pending"
                        ? "Requests waiting on a response will show up here."
                        : filter === "overdue"
                          ? "Requests past their due date will show up here."
                          : filter === "completed"
                            ? "Fulfilled requests will show up here."
                            : "Requests made for this section will show up here."}
                  </p>
              </div>
            ) : (
              filtered.map((req, i) => {
                const isOverdue = req.status === "Overdue";
                const accent = getAccent(req.status);
                const avatarBg = getAvatarColor(req.requestedBy);

                return (
                  <div
                    key={req.id}
                    style={{ transitionDelay: animateIn ? `${Math.min(i, 8) * 40}ms` : "0ms" }}
                    className={`relative flex rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 ease-out ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      } ${req.isOwnRequest ? "border-blue-100 ring-1 ring-blue-50" : "border-slate-100"}`}
                  >
                    <div className={`w-[3px] shrink-0 ${accent}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <FileText size={13} className="text-blue-500" />
                          </div>
                          <p className="text-[13px] font-bold text-slate-800 truncate">{req.fileName}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[9.5px] font-bold px-2 py-1 rounded-full border ${getStatusStyle(
                            req.status,
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center shrink-0`}>
                          <span className="text-[9.5px] font-bold text-white">{getInitials(req.requestedBy)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-semibold text-slate-700 truncate leading-tight flex items-center gap-1.5">
                            {req.requestedBy}
                            {req.isOwnRequest && (
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                <User2 size={8} /> You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{req.requesterRole}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1 justify-end">
                            <Calendar size={9} /> Due
                          </p>
                          <p className={`text-[11px] font-bold ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                            {req.dueDate}
                          </p>
                        </div>
                      </div>

                      {req.uploadedFileUrl && (
                        <a
                          href={req.uploadedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 bg-blue-50/60 hover:bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100 mb-2.5 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-md bg-white border border-blue-200 flex items-center justify-center shrink-0">
                            <Paperclip size={12} className="text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-blue-700 truncate leading-tight">
                              {req.uploadedFileName || req.fileName}
                            </p>
                            <p className="text-[9.5px] text-blue-400 font-semibold leading-tight mt-0.5">
                              {getFileExt(req.uploadedFileUrl)} · Uploaded file
                            </p>
                          </div>
                          <Eye size={13} className="text-blue-400 group-hover:text-blue-600 shrink-0" />
                        </a>
                      )}

                      {req.message && (
                        <div className="flex items-start gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                          <MessageSquareText size={11} className="text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-slate-500 italic leading-snug">{req.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}