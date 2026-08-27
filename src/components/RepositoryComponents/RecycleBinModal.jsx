import { useEffect, useState } from "react";
import { Trash2, RotateCcw, X, AlertTriangle } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";
import { supabase } from "../../lib/supabaseClient";

const DAYS_UNTIL_PURGE = 14;

function daysLeft(deletedAt) {
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(DAYS_UNTIL_PURGE - elapsed));
}

export default function RecycleBinModal({
  isOpen,
  onClose,
  sectionId,
  sectionName,
  userProfile,
  scope,           // "full" | "own"
  canPurgeForever, // true for officer+/admin, false for own-scope personnel
  getBucket,       // pass the shared getBucket(data_category) helper in
  onChanged,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    let query = supabase
      .from("files")
      .select("*")
      .eq("section_id", sectionId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (scope === "own") {
      query = query.eq("uploaded_by", userProfile?.id);
    }

    const { data, error } = await query;
    if (!error) setFiles(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sectionId, scope]);

  async function restore(file) {
    setBusyId(file.id);
    const { error } = await supabase
      .from("files")
      .update({ deleted_at: null, deleted_by: null, deleted_by_name: null })
      .eq("id", file.id);
    setBusyId(null);
    if (error) return alert(error.message);

    await supabase.from("audit_logs").insert({
      action: "Restore",
      file_name: file.file_name,
      details: `Restored from recycle bin in ${sectionName}`,
      performed_by: userProfile?.full_name ?? "Unknown",
      role: userProfile?.role,
      status: "Success",
    });

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    onChanged?.();
  }

  async function purgeForever(file) {
    if (
      !confirm(
        `Permanently delete "${file.file_name}"? This cannot be undone.`,
      )
    )
      return;
    setBusyId(file.id);
    try {
      const bucket = getBucket(file.data_category);
      if (file.file_path)
        await supabase.storage.from(bucket).remove([file.file_path]);
      if (file.verified_pdf_path)
        await supabase.storage
          .from("verified-pdfs")
          .remove([file.verified_pdf_path]);

      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        action: "Delete",
        file_name: file.file_name,
        details: `Permanently deleted from recycle bin in ${sectionName}`,
        performed_by: userProfile?.full_name ?? "Unknown",
        role: userProfile?.role,
        status: "Success",
      });

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      onChanged?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 max-h-[80vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trash2 size={18} className="text-slate-500" />
              <h2 className="font-bold text-slate-800">
                {scope === "own" ? "My Deleted Files" : "Recycle Bin"} —{" "}
                {sectionName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <p className="text-center text-sm text-slate-400 py-8">
                Loading…
              </p>
            ) : files.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                {scope === "own"
                  ? "You have no deleted files."
                  : "Recycle bin is empty."}
              </p>
            ) : (
              files.map((f) => {
                const left = daysLeft(f.deleted_at);
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {f.file_name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Deleted by {f.deleted_by_name ?? "Unknown"} ·{" "}
                        <span
                          className={
                            left <= 3 ? "text-red-500 font-semibold" : ""
                          }
                        >
                          {left === 0 ? "Purging soon" : `${left}d left`}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => restore(f)}
                        disabled={busyId === f.id}
                        title="Restore"
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                      >
                        <RotateCcw size={15} />
                      </button>
                      {canPurgeForever && (
                        <button
                          onClick={() => purgeForever(f)}
                          disabled={busyId === f.id}
                          title="Delete forever"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-[11px] text-slate-400">
            <AlertTriangle size={12} />
            Files are permanently deleted 14 days after being moved here.
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}