import { useState, useEffect } from "react";
import { X, User, CreditCard, Building2, UserCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { CustomDropdown } from "./CustomDropdown";

const roles = [
  "Administrator",
  "Division Focal Person",
  "Section Officer",
  "Section Personnel",
];

// Map DB role slugs <-> human-readable labels used in the dropdown
const ROLE_SLUG_TO_LABEL = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",
  section_personnel: "Section Personnel",
  administrator: "Administrator",
};
const ROLE_LABEL_TO_SLUG = Object.fromEntries(
  Object.entries(ROLE_SLUG_TO_LABEL).map(([slug, label]) => [label, slug]),
);

// Roles that are scoped to a DIVISION (pick from divisions table)
const DIVISION_ROLES = ["Division Focal Person"];
// Roles that are scoped to a SECTION (pick from sections table)
const SECTION_ROLES = ["Section Officer", "Section Personnel"];

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState(
    ROLE_SLUG_TO_LABEL[user.role] ?? user.role,
  );
  const [divisionId, setDivisionId] = useState(user.divisionId ?? "");
  const [sectionId, setSectionId] = useState(user.sectionId ?? "");

  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isDivisionRole = DIVISION_ROLES.includes(role);
  const isSectionRole = SECTION_ROLES.includes(role);
  const needsDivision = isDivisionRole || isSectionRole;

  // ─── Fetch divisions & sections once, when modal opens ─────────
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);

      const [{ data: divData, error: divError }, { data: secData, error: secError }] =
        await Promise.all([
          supabase.from("divisions").select("id, name").order("name"),
          supabase.from("sections").select("id, name, division_id").order("name"),
        ]);

      if (divError) console.error("Error fetching divisions:", divError.message);
      if (secError) console.error("Error fetching sections:", secError.message);

      setDivisions(divData ?? []);
      setSections(secData ?? []);
      setLoadingOptions(false);
    };

    fetchOptions();
  }, [isOpen]);

  // Clear the irrelevant selection whenever the role category changes
  useEffect(() => {
    if (!needsDivision) setDivisionId("");
    if (!isSectionRole) setSectionId("");
  }, [role, needsDivision, isSectionRole]);

  // Reset section when division changes (but only if it's a user interaction, 
  // we don't want to clear their initial section if the division matches)
  const handleDivisionChange = (val) => {
    setDivisionId(val);
    setSectionId("");
  };

  if (!isOpen) return null;

  const initialRole = ROLE_SLUG_TO_LABEL[user.role] ?? user.role;
  const initialDivisionId = user.divisionId ? String(user.divisionId) : "";
  const initialSectionId = user.sectionId ? String(user.sectionId) : "";

  const hasChanges = 
    role !== initialRole || 
    String(divisionId) !== initialDivisionId || 
    String(sectionId) !== initialSectionId;

  const handleSave = () => {
    if (loadingOptions) {
      alert("Please wait, loading options...");
      return;
    }
    if (needsDivision && !divisionId) {
      alert("Please select a division for this role.");
      return;
    }
    if (isSectionRole && !sectionId) {
      alert("Please select a section for this role.");
      return;
    }

    const divisionName = needsDivision
      ? divisions.find((d) => String(d.id) === String(divisionId))?.name ?? null
      : null;
    const sectionName = isSectionRole
      ? sections.find((s) => String(s.id) === String(sectionId))?.name ?? null
      : null;

    onSave(user.id, {
      role: ROLE_LABEL_TO_SLUG[role] ?? role,
      divisionId: needsDivision ? divisionId : null,
      sectionId: isSectionRole ? sectionId : null,
      divisionName,
      sectionName,
    });
    onClose();
  };

  const filteredSections = sections.filter(sec => 
    sec.division_id && sec.division_id.toString() === divisionId.toString()
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.12)] w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col p-6 sm:p-7 border-b border-slate-100 bg-slate-50/30 relative shrink-0">
          <div className="absolute right-5 top-5">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-blue-100 text-blue-600 shadow-sm border border-blue-200/50">
              <UserCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[1.25rem] font-black text-slate-800 tracking-[-0.02em] leading-tight">
                Edit User Details
              </h2>
              <p className="text-[0.8rem] font-semibold text-slate-400 mt-0.5">
                Modify account roles and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* User Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
              {user.avatar || "U"}
            </div>
          </div>

          {/* Name & ID (Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                Name
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} strokeWidth={2} />
                <input
                  type="text"
                  value={user.name}
                  readOnly
                  className="w-full bg-slate-50/80 pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/60 text-[0.85rem] font-semibold text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                ID Number
              </label>
              <div className="relative group">
                <CreditCard className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} strokeWidth={2} />
                <input
                  type="text"
                  value={user.idNumber}
                  readOnly
                  className="w-full bg-slate-50/80 pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/60 text-[0.85rem] font-semibold text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-2 rounded-full"></div>

          {/* Role (Editable) */}
          <div className="z-[60] relative">
            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
              Role
            </label>
            <CustomDropdown
              value={role}
              onChange={setRole}
              options={roles}
              icon={ShieldCheck}
              className="bg-slate-50/50"
            />
          </div>

          {/* Cascading Dropdowns */}
          {needsDivision && (
            <div className="grid grid-cols-1 gap-5 bg-slate-50/50 p-4 sm:p-5 rounded-[16px] border border-slate-100">
              {/* Division */}
              <div className="z-[50] relative">
                <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                  Division
                </label>
                <CustomDropdown
                  value={divisionId}
                  onChange={handleDivisionChange}
                  options={divisions.map(div => ({ value: div.id, label: div.name }))}
                  placeholder={loadingOptions ? "Loading divisions..." : "Select a division"}
                  disabled={loadingOptions}
                  icon={Building2}
                  className="bg-white"
                />
              </div>

              {/* Section — only for Section Officer / Section Personnel */}
              {isSectionRole && (
                <div className="z-[40] relative">
                  <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                    Section
                  </label>
                  <CustomDropdown
                    value={sectionId}
                    onChange={setSectionId}
                    options={filteredSections.map(sec => ({ value: sec.id, label: sec.name }))}
                    placeholder={loadingOptions ? "Loading sections..." : !divisionId ? "Select a division first" : "Select a section"}
                    disabled={loadingOptions || !divisionId}
                    icon={Building2}
                    className="bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-[12px] font-bold text-[0.85rem] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors order-1 sm:order-2"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}