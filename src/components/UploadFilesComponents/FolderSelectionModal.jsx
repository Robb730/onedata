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
    <div
      className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full max-w-md mx-0 lg:mx-4 flex flex-col max-h-[90dvh] lg:max-h-[80vh] border border-slate-200 border-b-0 lg:border-b overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="lg:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Select Section
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {isDivisionMode
                ? `Sections under ${divisionName || "your division"}`
                : "Choose which section to upload into"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 -mr-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder={
                isDivisionMode
                  ? "Search sections..."
                  : "Search divisions or sections..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 min-h-[44px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
              <Loader size={16} className="animate-spin" /> Loading…
            </div>
          ) : error ? (
            <p className="text-center py-8 text-sm text-red-400">{error}</p>
          ) : isDivisionMode ? (
            filteredFlatSections.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm text-slate-400">
                  {divisionId
                    ? "No sections found"
                    : "No division assigned to your account"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredFlatSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      handleSectionPick(section, divisionName, divisionId)
                    }
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 group-hover:text-blue-800 font-medium">
                      {section.name}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : filteredDivisions.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm text-slate-400">No results found</p>
            </div>
          ) : (
            filteredDivisions.map((div) => {
              const isExpanded = expandedDivision === div.id || !!searchQuery;
              const sections = getFilteredSections(div.id);

              return (
                <div key={div.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDivision(
                        isExpanded && !searchQuery ? null : div.id,
                      )
                    }
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <FolderOpen
                      size={17}
                      className="text-blue-500 flex-shrink-0"
                    />
                    <span className="text-sm font-semibold text-slate-800 flex-1">
                      {div.name}
                    </span>
                    <ChevronRight
                      size={15}
                      className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-4 sm:ml-6 mt-0.5 space-y-0.5">
                      {sections.length === 0 ? (
                        <p className="text-xs text-slate-400 px-3 py-2">
                          No sections
                        </p>
                      ) : (
                        sections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() =>
                              handleSectionPick(section, div.name, div.id)
                            }
                            className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-xl hover:bg-blue-50 transition-colors text-left group"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 flex-shrink-0" />
                            <span className="text-sm text-slate-700 group-hover:text-blue-800 font-medium">
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
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}