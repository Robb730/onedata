
import { useState } from "react";
import { X, User, CreditCard, Building2, UserCircle } from "lucide-react";

const divisions = [
  "Curriculum Implementation Division",
  "Office of the Schools Division Superintendent",
  "School Governance and Operations Division",
  "DRRM",
  "Education Facilities",
  "HRD",
  "Learner Formation",
  "Planning and Research",
  "School Health",
  "SIME",
  "SMN",
  "Sports",
];

const roles = [
  "Division Focal Person",
  "Section Officer",
  "Section Personnel",
  "Administrator",
  "Data Analyst",
  "Research Officer",
];

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [division, setDivision] = useState(user.division);
  const [role, setRole] = useState(user.role);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(user.id, { division, role });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* User Avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
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

          {/* Division/Section (Editable) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section/Division
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
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

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
