import { useState, useEffect } from "react";
import { X, User, Hash, Mail, Building2, UserCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// Roles that are scoped to a DIVISION (pick from divisions table)
const DIVISION_ROLES = ["Division Focal Person"];
// Roles that are scoped to a SECTION (pick from sections table)
const SECTION_ROLES = ["Section Officer", "Section Personnel"];

export default function AddNewUserModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Section Personnel");
  const [divisionId, setDivisionId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const roles = [
    "Division Focal Person",
    "Section Officer",
    "Section Personnel",
  ];

  const isDivisionRole = DIVISION_ROLES.includes(role);
  const isSectionRole = SECTION_ROLES.includes(role);

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
    if (isDivisionRole) setSectionId("");
    if (isSectionRole) setDivisionId("");
  }, [role, isDivisionRole, isSectionRole]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isDivisionRole && !divisionId) {
      alert("Please select a division for this role.");
      return;
    }
    if (isSectionRole && !sectionId) {
      alert("Please select a section for this role.");
      return;
    }

    if (name && idNumber && email && role) {
      onAdd({
        name,
        idNumber,
        email,
        role,
        divisionId: isDivisionRole ? divisionId : null,
        sectionId: isSectionRole ? sectionId : null,
      });
      // Reset form
      setName("");
      setIdNumber("");
      setEmail("");
      setRole("Section Personnel");
      setDivisionId("");
      setSectionId("");
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[60] flex items-end lg:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-3.5rem)] lg:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 border-b-0 lg:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g., SDO-2024-001"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@deped.gov.ph"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Login credentials will be sent to this email</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                required
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Division — only for Division Focal Person */}
          {isDivisionRole && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Division <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <select
                  value={divisionId}
                  onChange={(e) => setDivisionId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Loading divisions..." : "Select a division"}
                  </option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Section — only for Section Officer / Section Personnel */}
          {isSectionRole && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Loading sections..." : "Select a section"}
                  </option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}