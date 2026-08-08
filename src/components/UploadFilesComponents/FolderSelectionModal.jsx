import { X, FolderOpen, ChevronRight, Search, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FolderSelectionModal({
  isOpen,
  onClose,
  onSelect,
  mode = "admin",       // "admin" | "division"
  divisionId = null,    // required when mode === "division"
  divisionName = "",    // used for the header + returned onSelect payload
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [sectionsByDivision, setSectionsByDivision] = useState({});
  const [flatSections, setFlatSections] = useState([]);
  const [expandedDivision, setExpandedDivision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDivisionMode = mode === "division";

  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      if (isDivisionMode) {
        // Flat mode: only this division's sections, no division picker/expand
        if (!divisionId) {
          setFlatSections([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("sections")
          .select("id, name, division_id")
          .eq("division_id", divisionId)
          .order("name");

        if (error) { setError(error.message); setLoading(false); return; }
        setFlatSections(data || []);
        setLoading(false);
        return;
      }

      // Admin mode: full divisions + sections tree
      const [divRes, secRes] = await Promise.all([
        supabase.from("divisions").select("id, name").order("name"),
        supabase.from("sections").select("id, name, division_id").order("name"),
      ]);

      if (divRes.error) { setError(divRes.error.message); setLoading(false); return; }
      if (secRes.error) { setError(secRes.error.message); setLoading(false); return; }

      setDivisions(divRes.data || []);

      const grouped = {};
      for (const section of secRes.data || []) {
        if (!grouped[section.division_id]) grouped[section.division_id] = [];
        grouped[section.division_id].push(section);
      }
      setSectionsByDivision(grouped);
      setLoading(false);
    }

    fetchData();
  }, [isOpen, isDivisionMode, divisionId]);

  if (!isOpen) return null;

  // ── Flat (division-scoped) filtering ──
  const filteredFlatSections = flatSections.filter((s) => {
    const q = searchQuery.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });

  // ── Admin (tree) filtering ──
  const filteredDivisions = divisions.filter((div) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (div.name.toLowerCase().includes(q)) return true;
    return (sectionsByDivision[div.id] || []).some((s) =>
      s.name.toLowerCase().includes(q)
    );
  });

  const getFilteredSections = (divisionIdKey) => {
    const q = searchQuery.toLowerCase();
    return (sectionsByDivision[divisionIdKey] || []).filter(
      (s) => !q || s.name.toLowerCase().includes(q)
    );
  };

  const handleSectionPick = (section, divName, divId) => {
    onSelect({
      id: section.id,
      name: section.name,
      divisionId: divId,
      divisionName: divName,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Section</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDivisionMode
                ? `Sections under ${divisionName || "your division"}`
                : "Choose which section to upload into"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={isDivisionMode ? "Search sections..." : "Search divisions or sections..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-400">
              <Loader size={16} className="animate-spin" /> Loading…
            </div>
          ) : error ? (
            <p className="text-center py-8 text-sm text-red-400">{error}</p>
          ) : isDivisionMode ? (
            // ── Flat list, no division header/expand ──
            filteredFlatSections.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400">
                  {divisionId ? "No sections found" : "No division assigned to your account"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredFlatSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionPick(section, divisionName, divisionId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 group-hover:text-blue-800 font-medium">
                      {section.name}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : filteredDivisions.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm text-gray-400">No results found</p>
            </div>
          ) : (
            filteredDivisions.map((div) => {
              const isExpanded = expandedDivision === div.id || !!searchQuery;
              const sections = getFilteredSections(div.id);

              return (
                <div key={div.id} className="mb-1">
                  <button
                    onClick={() =>
                      setExpandedDivision(isExpanded && !searchQuery ? null : div.id)
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FolderOpen size={17} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800 flex-1">
                      {div.name}
                    </span>
                    <ChevronRight
                      size={15}
                      className={`text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {sections.length === 0 ? (
                        <p className="text-xs text-gray-400 px-3 py-2">No sections</p>
                      ) : (
                        sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => handleSectionPick(section, div.name, div.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 group-hover:text-blue-800 font-medium">
                              {section.name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}