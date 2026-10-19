import { useState, useEffect, useRef } from "react";
import { X, User, Hash, Mail, Building2, UserCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { CustomDropdown } from "./CustomDropdown";
import ModalPortal from "../Modals/ModalPortal";
import CreatingUserOverlay from "./CreatingUserOverlay";

// Roles that are scoped to a DIVISION (pick from divisions table)
const DIVISION_ROLES = ["Division Focal Person"];
// Roles that are scoped to a SECTION (pick from sections table)
const SECTION_ROLES = ["Section Officer", "Section Personnel"];

export default function AddNewUserModal({ isOpen, onClose, onAdd, isSubmitting = false, focusEmailKey = 0 }) {
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Section Personnel");
  const [divisionId, setDivisionId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const emailInputRef = useRef(null);

  const roles = [
    "Administrator",
    "Division Focal Person",
    "Section Officer",
    "Section Personnel",
  ];

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

  // Reset the irrelevant selection whenever the role category changes
  useEffect(() => {
    if (!needsDivision) setDivisionId("");
    if (!isSectionRole) setSectionId("");
  }, [role, needsDivision, isSectionRole]);

  // Reset section when division changes
  useEffect(() => {
    setSectionId("");
  }, [divisionId]);

  // When returning from the duplicate-email error modal, focus the email
  // field so the user can fix just the email and resubmit.
  useEffect(() => {
    if (focusEmailKey > 0 && isOpen && !isSubmitting) {
      emailInputRef.current?.focus();
      emailInputRef.current?.select?.();
    }
  }, [focusEmailKey, isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    if (name && idNumber && email && role) {
      // No local reset here — the parent unmounts this modal on success
      // (clearing state) and keeps it mounted with values intact on error.
      await onAdd({
        name,
        idNumber,
        email,
        role,
        divisionId: needsDivision ? divisionId : null,
        sectionId: isSectionRole ? sectionId : null,
      });
    }
  };

  const filteredSections = sections.filter(sec => 
    sec.division_id && sec.division_id.toString() === divisionId.toString()
  );

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      onClick={handleClose}
    >
      <div className="modal-overlay absolute inset-0" aria-hidden="true" />
      <div
        className="relative z-10 bg-white rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.12)] w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isSubmitting ? (
          /* Loading-only view — fields hidden, just the cute animation */
          <div className="flex min-h-[420px] flex-col items-center justify-center p-6 sm:p-8">
            <CreatingUserOverlay email={email} inline />
          </div>
        ) : (
        <>
        {/* Header */}
        <div className="flex flex-col p-6 sm:p-7 border-b border-slate-100 bg-slate-50/30 relative shrink-0">
          <div className="absolute right-5 top-5">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                Add New User
              </h2>
              <p className="text-[0.8rem] font-semibold text-slate-400 mt-0.5">
                Register a new account into the system
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Name */}
          <div>
            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} strokeWidth={2} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                disabled={isSubmitting}
                className="w-full bg-slate-50/50 pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/80 text-[0.85rem] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all disabled:opacity-60"
                required
              />
            </div>
          </div>

          {/* ID Number & Email - 2 Column Layout if needed, but keeping it stacked for cleaner mobile view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ID Number */}
            <div>
              <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                ID Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Hash className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} strokeWidth={2} />
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. SDO-24-01"
                  disabled={isSubmitting}
                  className="w-full bg-slate-50/50 pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/80 text-[0.85rem] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} strokeWidth={2} />
                <input
                  type="email"
                  ref={emailInputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@deped.gov.ph"
                  disabled={isSubmitting}
                  className="w-full bg-slate-50/50 pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/80 text-[0.85rem] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all disabled:opacity-60"
                  required
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-2 rounded-full"></div>

          {/* Role */}
          <div className="z-[60] relative">
            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
              Role <span className="text-rose-500">*</span>
            </label>
            <CustomDropdown
              value={role}
              onChange={setRole}
              options={roles}
              icon={ShieldCheck}
              disabled={isSubmitting}
              className="bg-slate-50/50"
            />
          </div>

          {/* Cascading Dropdowns */}
          {needsDivision && (
            <div className="grid grid-cols-1 gap-5 bg-slate-50/50 p-4 sm:p-5 rounded-[16px] border border-slate-100">
              {/* Division */}
              <div className="z-[50] relative">
                <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                  Division <span className="text-rose-500">*</span>
                </label>
                <CustomDropdown
                  value={divisionId}
                  onChange={setDivisionId}
                  options={divisions.map(div => ({ value: div.id, label: div.name }))}
                  placeholder={loadingOptions ? "Loading divisions..." : "Select a division"}
                  disabled={loadingOptions || isSubmitting}
                  icon={Building2}
                  className="bg-white"
                />
              </div>

              {/* Section — only for Section Officer / Section Personnel */}
              {isSectionRole && (
                <div className="z-[40] relative">
                  <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <CustomDropdown
                    value={sectionId}
                    onChange={setSectionId}
                    options={filteredSections.map(sec => ({ value: sec.id, label: sec.name }))}
                    placeholder={loadingOptions ? "Loading sections..." : !divisionId ? "Select a division first" : "Select a section"}
                    disabled={loadingOptions || !divisionId || isSubmitting}
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-[12px] font-bold text-[0.85rem] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingOptions}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] bg-blue-500 px-4 py-3 text-[0.85rem] font-bold text-white shadow-[0_4px_12px_rgba(59,130,246,0.25)] hover:bg-blue-600 active:bg-blue-700 hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Create User
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}