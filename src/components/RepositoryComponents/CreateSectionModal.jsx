import { useState, useEffect } from "react";
import { X, FolderPlus, Loader, User } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function CreateSectionModal({
  isOpen,
  onClose,
  divisionId,
  divisionName,
  existingSectionNames = [],
  onCreated,
}) {
  const [name, setName] = useState("");
  const [assignFocalNow, setAssignFocalNow] = useState(false);
  const [focalOptions, setFocalOptions] = useState([]);
  const [selectedFocalId, setSelectedFocalId] = useState("");
  const [loadingFocals, setLoadingFocals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setAssignFocalNow(false);
    setSelectedFocalId("");
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !assignFocalNow || !divisionId) return;
    let cancelled = false;
    setLoadingFocals(true);
    supabase
      .from("users")
      .select("uuid, full_name")
      .eq("division_id", divisionId)
      .eq("role", "section_focal")
      .eq("is_active", true)
      .is("section_id", null) // only unassigned focals, adjust if your schema differs
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("Failed to load focal candidates:", err);
          setFocalOptions([]);
        } else {
          setFocalOptions(data || []);
        }
        setLoadingFocals(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, assignFocalNow, divisionId]);

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const isDuplicate = existingSectionNames.some(
    (n) => n.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  const canSubmit = trimmedName.length > 0 && !isDuplicate && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: newSection, error: insertError } = await supabase
        .from("sections")
        .insert({
          name: trimmedName,
          division_id: divisionId,
        })
        .select("id, name, managed_by")
        .single();

      if (insertError) throw insertError;

      if (assignFocalNow && selectedFocalId) {
        const { error: assignError } = await supabase
          .from("users")
          .update({ section_id: newSection.id })
          .eq("uuid", selectedFocalId);

        if (assignError) {
          console.error("Section created but focal assignment failed:", assignError);
        }
      }

      onCreated(newSection);
    } catch (err) {
      console.error("Failed to create section:", err);
      setError(err.message || "Failed to create section.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full lg:max-w-md lg:mx-4 max-h-[90dvh] flex flex-col overflow-hidden rounded-t-2xl lg:rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FolderPlus size={17} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Section</h2>
              <p className="text-xs text-slate-400">
                Inside <span className="font-medium text-slate-500">{divisionName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Section Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Learner Formation"
                autoFocus
                className="w-full px-3.5 py-2.5 min-h-[44px] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {isDuplicate && (
                <p className="text-[11px] text-red-500 mt-1.5">
                  A section with this name already exists in {divisionName}.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignFocalNow}
                  onChange={(e) => setAssignFocalNow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Assign a section officer now
                </span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1 ml-6.5 pl-0.5">
                Optional — you can assign one later from the section page.
              </p>

              {assignFocalNow && (
                <div className="mt-3">
                  {loadingFocals ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <Loader size={13} className="animate-spin" /> Loading available officers…
                    </div>
                  ) : focalOptions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      No unassigned section officers found in this division.
                    </p>
                  ) : (
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={15}
                      />
                      <select
                        value={selectedFocalId}
                        onChange={(e) => setSelectedFocalId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        <option value="">Select an officer…</option>
                        {focalOptions.map((u) => (
                          <option key={u.uuid} value={u.uuid}>
                            {u.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader className="animate-spin" size={15} /> : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}