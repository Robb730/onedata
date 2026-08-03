import { useState, useEffect } from "react";
import { X, User, CreditCard, Building2, UserCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const roles = [
  "Division Focal Person",
  "Section Officer",
  "Section Personnel",
  "Administrator",
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
    if (isDivisionRole) setSectionId("");
    if (isSectionRole) setDivisionId("");
  }, [role, isDivisionRole, isSectionRole]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (isDivisionRole && !divisionId) {
      alert("Please select a division for this role.");
      return;
    }
    if (isSectionRole && !sectionId) {
      alert("Please select a section for this role.");
      return;
    }

    onSave(user.id, {
      role: ROLE_LABEL_TO_SLUG[role] ?? role,
      divisionId: isDivisionRole ? divisionId : null,
      sectionId: isSectionRole ? sectionId : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={22} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* User Avatar */}
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
              {user.avatar}
            </div>
          </div>

          {/* Name (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={user.name}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
          </div>

          {/* ID Number (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={user.idNumber}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
          </div>

          {/* Role (Editable) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                Division
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <select
                  value={divisionId}
                  onChange={(e) => setDivisionId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                Section
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
          <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors order-2 sm:order-1"
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