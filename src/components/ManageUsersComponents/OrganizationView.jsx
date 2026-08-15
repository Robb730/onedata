import { useMemo, useState } from "react";
import {
  ORGANIZATION_DIVISIONS,
  isAdministrator,
  isDivisionFocal,
  belongsToDivision,
  belongsToSection,
} from "./organizationStructure";
import DivisionGroup from "./DivisionGroup";
import UserCollection from "./UserCollection";
import OrganizationEmptyState from "./OrganizationEmptyState";

export default function OrganizationView({
  users,
  searchQuery = "",
  selectedDivision = "All",
  viewMode = "list",
  getRoleDisplay,
  getRoleBadgeColor,
  onViewLogs,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}) {
  const [expandedDivisions, setExpandedDivisions] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  const isSearching = searchQuery.trim().length > 0;
  const userRowProps = {
    getRoleDisplay,
    getRoleBadgeColor,
    onViewLogs,
    onEdit,
    onActivate,
    onDeactivate,
    onDelete,
    showOrgPath: isSearching,
    viewMode,
  };

  const administrators = useMemo(
    () => users.filter(isAdministrator),
    [users],
  );

  const visibleDivisions = useMemo(() => {
    if (selectedDivision === "All" || selectedDivision === "Administrator") {
      return selectedDivision === "Administrator" ? [] : ORGANIZATION_DIVISIONS;
    }
    return ORGANIZATION_DIVISIONS.filter((d) => d.name === selectedDivision);
  }, [selectedDivision]);

  const grouped = useMemo(() => {
    return visibleDivisions.map((division) => {
      const inDivision = users.filter((u) => belongsToDivision(u, division.name));
      const focals = inDivision.filter(isDivisionFocal);
      const sections = division.sections.map((name) => ({
        name,
        users: inDivision.filter((u) => belongsToSection(u, name)),
      }));
      const assignedIds = new Set([
        ...focals.map((u) => u.id),
        ...sections.flatMap((s) => s.users.map((u) => u.id)),
      ]);
      const unassigned = inDivision.filter((u) => !assignedIds.has(u.id));
      const health = {
        focalCount: focals.length,
        emptySections: sections.filter((s) => s.users.length === 0).length,
        inactiveCount: inDivision.filter((u) => u.status !== "Active").length,
      };
      return { division, focals, sections, unassigned, health };
    });
  }, [users, visibleDivisions]);

  const showAdministrators =
    selectedDivision === "All" || selectedDivision === "Administrator";

  const toggleDivision = (id) => {
    setExpandedDivisions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (divisionId, sectionName) => {
    const key = `${divisionId}:${sectionName}`;
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAnyUsers = users.length > 0;

  if (!hasAnyUsers && isSearching) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <OrganizationEmptyState
          title="No users found"
          message="Try adjusting your search or filter criteria"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {showAdministrators && (!isSearching || administrators.length > 0) && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-[1.1rem] font-bold text-slate-800 tracking-[-0.01em]">
              Administrator
            </h2>
            <span className="text-[0.72rem] font-semibold text-slate-400 shrink-0">
              {administrators.length}{" "}
              {administrators.length === 1 ? "user" : "users"}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {administrators.length === 0 ? (
              <OrganizationEmptyState
                title="No administrators found."
                message="Administrators are not assigned to a division or section."
              />
            ) : (
              <UserCollection
                users={administrators}
                viewMode={viewMode}
                {...userRowProps}
              />
            )}
          </div>
        </section>
      )}

      {visibleDivisions.length > 0 &&
        (!isSearching ||
          grouped.some(
            ({ focals, sections, unassigned }) =>
              focals.length > 0 ||
              unassigned.length > 0 ||
              sections.some((s) => s.users.length > 0),
          )) && (
        <section>
          <div className="mb-3">
            <h2 className="text-base sm:text-[1.1rem] font-bold text-slate-800 tracking-[-0.01em]">
              Organization
            </h2>
          </div>

          <div className="space-y-3">
            {grouped.map(({ division, focals, sections, unassigned, health }) => {
              const hasMatches =
                focals.length > 0 ||
                unassigned.length > 0 ||
                sections.some((s) => s.users.length > 0);
              if (isSearching && !hasMatches) return null;
              // Collapsed by default on load; only expanded once the user
              // explicitly toggles it (or while actively searching).
              const expanded = isSearching
                ? hasMatches
                : expandedDivisions[division.id] ?? false;
              const sectionState = expandedSections;

              return (
                <DivisionGroup
                  key={division.id}
                  division={division}
                  focals={focals}
                  sections={sections}
                  unassigned={unassigned}
                  health={health}
                  expanded={expanded}
                  onToggle={() => toggleDivision(division.id)}
                  expandedSections={Object.fromEntries(
                    Object.entries(sectionState)
                      .filter(([key]) => key.startsWith(`${division.id}:`))
                      .map(([key, value]) => [key.split(":").slice(1).join(":"), value]),
                  )}
                  onToggleSection={(sectionName) =>
                    toggleSection(division.id, sectionName)
                  }
                  forceExpandSections={isSearching}
                  {...userRowProps}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}