import { useState } from "react";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";

function getStatusBadge(req) {
  const isOverdue =
    req.status === "pending" &&
    req.deadline &&
    new Date(req.deadline) < new Date();

  if (req.status === "completed")
    return {
      label: "Completed",
      cls: "bg-teal-50 text-teal-700 border-teal-200",
      Icon: CheckCircle2,
    };
  if (isOverdue)
    return {
      label: "Overdue",
      cls: "bg-red-50 text-red-700 border-red-200",
      Icon: AlertCircle,
    };
  return {
    label: "Pending",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
    Icon: Clock,
  };
}

export default function FileRequestsPanel({ isOpen, onClose, requests }) {
  const [page, setPage] = useState(1);
  const perPage = 5;

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(requests.length / perPage));
  const paginated = requests.slice((page - 1) * perPage, page * perPage);

  function handleClose() {
    setPage(1);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">My File Requests</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">
              No file requests yet.
            </p>
          ) : (
            paginated.map((req) => {
              const { label, cls, Icon } = getStatusBadge(req);
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {req.file_name}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cls}`}
                    >
                      <Icon size={10} /> {label}
                    </span>
                  </div>
                  {req.description && (
                    <p className="text-[12px] text-slate-500 mt-1.5">
                      {req.description}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Due:{" "}
                    {req.deadline
                      ? new Date(req.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {requests.length > perPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
            <p className="text-[11px] text-slate-400">
              Page <span className="font-semibold text-slate-600">{page}</span> of{" "}
              <span className="font-semibold text-slate-600">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
