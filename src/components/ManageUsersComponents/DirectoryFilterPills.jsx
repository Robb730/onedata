import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";
import ModalPortal from "../Modals/ModalPortal";

const ROLE_OPTIONS = [
  { id: "All", label: "All roles" },
  { id: "administrator", label: "Administrator" },
  { id: "division_focal", label: "Division Focal Person" },
  { id: "section_focal", label: "Section Officer" },
  { id: "section_personnel", label: "Section Personnel" },
];

const STATUS_OPTIONS = [
  { id: "All", label: "All status" },
  { id: "Active", label: "Active" },
  { id: "Inactive", label: "Inactive" },
];

function SelectField({ id, label, value, onChange, options, zIndex = 10 }) {
  return (
    <label className="block relative" style={{ zIndex }}>
      <span className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <CustomDropdown
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
        className="bg-slate-50/70"
      />
    </label>
  );
}

function FilterFields({
  divisions,
  selectedDivision,
  onDivisionChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
}) {
  return (
    <div className="space-y-3">
      <SelectField
        id="user-division-filter"
        label="Division"
        value={selectedDivision}
        onChange={onDivisionChange}
        options={divisions.map((div) => ({
          value: div,
          label: div === "All" ? "All divisions" : div,
        }))}
        zIndex={50}
      />
      <SelectField
        id="user-role-filter"
        label="Role"
        value={selectedRole}
        onChange={onRoleChange}
        options={ROLE_OPTIONS.map((r) => ({ value: r.id, label: r.label }))}
        zIndex={40}
      />
      <SelectField
        id="user-status-filter"
        label="Status"
        value={selectedStatus}
        onChange={onStatusChange}
        options={STATUS_OPTIONS.map((s) => ({ value: s.id, label: s.label }))}
        zIndex={30}
      />
    </div>
  );
}

function FilterPanelHeader({ activeCount, clearAll }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-[0.8rem] font-bold text-slate-800">Filter directory</p>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[0.72rem] font-semibold text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default function DirectoryFilterPills({
  divisions = [],
  selectedDivision,
  onDivisionChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const activeChips = [
    selectedDivision !== "All" && {
      key: "division",
      label: selectedDivision,
      onClear: () => onDivisionChange("All"),
    },
    selectedRole !== "All" && {
      key: "role",
      label: ROLE_OPTIONS.find((r) => r.id === selectedRole)?.label ?? selectedRole,
      onClear: () => onRoleChange("All"),
    },
    selectedStatus !== "All" && {
      key: "status",
      label: selectedStatus,
      onClear: () => onStatusChange("All"),
    },
  ].filter(Boolean);

  const activeCount = activeChips.length;

  const clearAll = () => {
    onDivisionChange("All");
    onRoleChange("All");
    onStatusChange("All");
  };

  useEffect(() => {
    if (!open) return undefined;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      document.body.classList.toggle("hide-mobile-nav", open && mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.body.classList.remove("hide-mobile-nav");
    };
  }, [open]);

  return (
    <div ref={panelRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-[0.8rem] font-semibold transition-colors ${
          open || activeCount > 0
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200/80 bg-slate-50/70 text-slate-600 hover:bg-white"
        }`}
        aria-expanded={open}
      >
        <SlidersHorizontal size={15} />
        <span className="hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[0.65rem] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <ModalPortal>
            <div className="lg:hidden">
              <div
                className="modal-overlay fixed inset-0 z-[60]"
                onClick={() => setOpen(false)}
              />
              <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl border border-slate-200 border-b-0 bg-white p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(15,23,42,0.12)]">
                <div className="mb-3 flex justify-center">
                  <div className="h-1 w-10 rounded-full bg-slate-200" />
                </div>
                <FilterPanelHeader activeCount={activeCount} clearAll={clearAll} />
                <FilterFields
                  divisions={divisions}
                  selectedDivision={selectedDivision}
                  onDivisionChange={onDivisionChange}
                  selectedRole={selectedRole}
                  onRoleChange={onRoleChange}
                  selectedStatus={selectedStatus}
                  onStatusChange={onStatusChange}
                />
              </div>
            </div>
          </ModalPortal>
          <div className="hidden lg:block absolute right-0 top-full z-[70] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            <FilterPanelHeader activeCount={activeCount} clearAll={clearAll} />
            <FilterFields
              divisions={divisions}
              selectedDivision={selectedDivision}
              onDivisionChange={onDivisionChange}
              selectedRole={selectedRole}
              onRoleChange={onRoleChange}
              selectedStatus={selectedStatus}
              onStatusChange={onStatusChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function DirectoryActiveChips({
  selectedDivision,
  onDivisionChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
}) {
  const chips = [
    selectedDivision !== "All" && {
      key: "division",
      label: selectedDivision,
      onClear: () => onDivisionChange("All"),
    },
    selectedRole !== "All" && {
      key: "role",
      label: ROLE_OPTIONS.find((r) => r.id === selectedRole)?.label ?? selectedRole,
      onClear: () => onRoleChange("All"),
    },
    selectedStatus !== "All" && {
      key: "status",
      label: selectedStatus,
      onClear: () => onStatusChange("All"),
    },
  ].filter(Boolean);

  if (chips.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600 hover:border-slate-300"
        >
          {chip.label}
          <X size={11} className="text-slate-400" />
        </button>
      ))}
    </div>
  );
}
