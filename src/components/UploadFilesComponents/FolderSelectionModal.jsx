import { X, Folder, Search } from "lucide-react";
import { useState } from "react";

const folders = [
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

export default function FolderSelectionModal({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredFolders = folders.filter(folder =>
    folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Folder List */}
        <div className="max-h-96 overflow-y-auto p-4">
          {filteredFolders.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-500">No folders found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFolders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => {
                    onSelect(folder);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                >
                  <Folder className="text-blue-500 group-hover:text-blue-600" size={20} />
                  <span className="text-sm text-gray-900 font-medium">{folder}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
