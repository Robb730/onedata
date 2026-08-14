import { ChevronRight, Building2, Shield } from "lucide-react";
import SectionAccordion from "./SectionAccordion";
import UserCollection from "./UserCollection";
import OrganizationEmptyState from "./OrganizationEmptyState";

export default function DivisionGroup({
  division,
  focals,
  sections,
  unassigned,
  health,
  expanded,
  onToggle,
  expandedSections,
  onToggleSection,
  forceExpandSections = false,
  viewMode = "list",
  ...userRowProps
}) {
  const sectionCount = division.sections.length;
  const missingFocal = (health?.focalCount ?? focals.length) === 0;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden ${
        missingFocal ? "border-amber-200/80" : "border-slate-200/80"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-[52px] sm:min-h-0 items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 text-left hover:bg-slate-50/70 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Building2 size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="truncate text-[0.84rem] sm:text-[0.95rem] font-bold text-slate-800 tracking-tight">
              {division.name}
            </p>
            {missingFocal && (
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 sm:px-2 py-0.5 text-[0.58rem] sm:text-[0.62rem] font-bold text-amber-700">
                No focal
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[0.68rem] sm:text-[0.72rem] font-medium text-slate-400">
            <span className="sm:hidden">
              {health?.focalCount ?? focals.length} focal
              <span className="text-slate-300"> · </span>
              {sectionCount} {sectionCount === 1 ? "sec" : "secs"}
              {health != null && health.emptySections > 0 && (
                <>
                  <span className="text-slate-300"> · </span>
                  {health.emptySections} empty
                </>
              )}
            </span>
            <span className="hidden sm:inline truncate">
              {division.shortName}
              <span className="text-slate-300"> · </span>
              {health?.focalCount ?? focals.length}{" "}
              {(health?.focalCount ?? focals.length) === 1 ? "focal" : "focals"}
              <span className="text-slate-300"> · </span>
              {sectionCount} {sectionCount === 1 ? "section" : "sections"}
              {health != null && (
                <>
                  <span className="text-slate-300"> · </span>
                  {health.emptySections} empty
                  <span className="text-slate-300"> · </span>
                  {health.inactiveCount} inactive
                </>
              )}
            </span>
          </p>
        </div>
        <ChevronRight
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t border-slate-100 px-2.5 sm:px-4 pb-3 sm:pb-4 pt-3 space-y-3 sm:space-y-4 transition-opacity duration-200 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            <div>
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <Shield size={12} className="text-purple-500" />
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                  Division Focal Person
                </p>
              </div>
              {focals.length === 0 ? (
                <OrganizationEmptyState
                  title="No Division Focal Person assigned."
                  message="This role manages the entire division, not a single section."
                />
              ) : (
                <UserCollection users={focals} viewMode={viewMode} {...userRowProps} />
              )}
            </div>

            <div>
              <p className="mb-2 px-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                Sections
              </p>
              <div className="space-y-2">
                {sections.map(({ name, users }) => (
                  <SectionAccordion
                    key={name}
                    name={name}
                    users={users}
                    expanded={!!expandedSections[name]}
                    forceExpanded={forceExpandSections && users.length > 0}
                    onToggle={() => onToggleSection(name)}
                    viewMode={viewMode}
                    {...userRowProps}
                  />
                ))}
                {unassigned.length > 0 && (
                  <SectionAccordion
                    name="Unassigned"
                    users={unassigned}
                    expanded={!!expandedSections["Unassigned"]}
                    forceExpanded={forceExpandSections}
                    onToggle={() => onToggleSection("Unassigned")}
                    viewMode={viewMode}
                    {...userRowProps}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
