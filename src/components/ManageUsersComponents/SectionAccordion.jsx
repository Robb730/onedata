import { ChevronRight } from "lucide-react";
import UserCollection from "./UserCollection";
import OrganizationEmptyState from "./OrganizationEmptyState";

export default function SectionAccordion({
  name,
  users,
  expanded,
  onToggle,
  forceExpanded = false,
  viewMode = "list",
  ...userRowProps
}) {
  const isOpen = forceExpanded || expanded;
  const count = users.length;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-[44px] items-center gap-2 px-3 sm:px-3.5 py-2.5 sm:py-3 text-left hover:bg-slate-50/80 transition-colors"
        aria-expanded={isOpen}
      >
        <ChevronRight
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        <span className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold text-slate-800">
          {name}
        </span>
        <span className="shrink-0 text-[0.7rem] font-semibold text-slate-400">
          {count} {count === 1 ? "user" : "users"}
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t border-slate-100 bg-slate-50/40 px-2 py-2 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {count === 0 ? (
              <OrganizationEmptyState
                title="No users assigned to this section."
                message="Section Officers and Section Personnel will appear here."
              />
            ) : (
              <UserCollection users={users} viewMode={viewMode} {...userRowProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
