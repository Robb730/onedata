import { useState } from "react";
import { FolderOpen, Search, Grid3x3, List, Calendar, User, Lock } from "lucide-react";

function FolderCard({ name, fileCount, date, owner, icon: Icon = FolderOpen, iconColor = "text-teal-500", iconBgColor = "bg-teal-50", onClick, locked = false }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // ✅ Always call onClick — let the parent decide what to show (detail or restricted)
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl p-5 transition-all border border-gray-100 relative
        ${locked ? "opacity-70 cursor-pointer" : "hover:shadow-lg cursor-pointer"}`}
    >
      {/* Restricted badge */}
      {locked && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-50 border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          <Lock size={9} />
          Restricted
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 ${locked ? "bg-gray-100" : iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 relative`}>
          <Icon className={locked ? "text-gray-400" : iconColor} size={24} />
          {locked && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
              <Lock size={9} className="text-white" />
            </div>
          )}
        </div>
      </div>

      <h3 className={`font-bold mb-3 text-sm leading-tight ${locked ? "text-gray-400" : "text-gray-900"}`}>
        {name}
      </h3>

      <div className="flex items-center gap-1.5 mb-4">
        <div className={`w-1.5 h-1.5 rounded-full ${locked ? "bg-gray-300" : "bg-green-500"}`}></div>
        <span className={`text-xs font-medium ${locked ? "text-gray-400" : "text-green-600"}`}>
          {locked ? "Restricted" : "Active"}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>{fileCount} files</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={12} />
          <span>{owner}</span>
        </div>
      </div>
    </div>
  );
}

export default function Repository({ onFolderClick, onLockedFolderClick, role }) {
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const folders = [
    {
      name: "Curriculum Implementation Division",
      fileCount: 48,
      date: "Feb 20, 2026",
      owner: "Juan Paolo",
      icon: FolderOpen,
      iconColor: "text-teal-500",
      iconBgColor: "bg-teal-50",
      allowedRoles: ["admin"],
    },
    {
      name: "Office of the Schools Division Superintendent",
      fileCount: 152,
      date: "Feb 18, 2026",
      owner: "Hensley Santos",
      icon: FolderOpen,
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-50",
      allowedRoles: ["admin"],
    },
    {
      name: "School Governance and Operations Division",
      fileCount: 67,
      date: "Feb 19, 2026",
      owner: "Robbi Olazo",
      icon: FolderOpen,
      iconColor: "text-purple-500",
      iconBgColor: "bg-purple-50",
      allowedRoles: ["admin", "division", "sectionFocal", "personnel"],
    },
  ];

  const tabs = ["All", "Active", "Review", "Archived"];

  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" ? true : activeTab === "Active";
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Repository</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and manage division folders and documents</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Name</option>
              <option>Date</option>
              <option>Size</option>
            </select>
          </div>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeTab === tab ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Showing {filteredFolders.length} folders</p>
        {role !== "admin" && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock size={11} />
            <span>Some folders are restricted based on your role</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFolders.map((folder) => {
          const isLocked = !folder.allowedRoles.includes(role);
          return (
            <FolderCard
              key={folder.name}
              {...folder}
              locked={isLocked}
              onClick={() => {
                if (isLocked) {
                  // ✅ Navigate to restricted page instead of silently blocking
                  onLockedFolderClick && onLockedFolderClick(folder);
                } else {
                  onFolderClick && onFolderClick(folder);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
