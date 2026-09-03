// FloatingTemplatesButton.jsx
// Renders a floating button on the Repository Folder Detail page. Only
// visible to division_focal, section_focal, and section_personnel.
// Clicking it opens the TemplatesModal for the user's assigned section/division.
//
// Positioning: this button shares its floating corner with
// FloatingAccessRequestsButton. When that button is also visible for this
// role, Templates docks *above* it with a fixed gap. When it isn't (e.g.
// section_personnel, who can view templates but can't approve access
// requests), Templates falls back to the base position instead of floating
// alone at the "stacked" height with an empty gap beneath it.

import { LayoutTemplate } from "lucide-react";
import { canViewSectionTemplates } from "../../utils/accessControl";
import { canApproveAccessRequests } from "../../utils/accessRequestsApi";

export default function FloatingTemplatesButton({ userProfile, section, onClick }) {
  if (!canViewSectionTemplates(userProfile, section)) return null;

  const stacked = canApproveAccessRequests(userProfile);

  return (
    <button
      id="floating-templates-btn"
      onClick={onClick}
      className={`group fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-[0_12px_30px_rgba(5,150,105,0.35)] transition-all hover:scale-105 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 lg:right-6 ${
        stacked
          ? "bottom-[calc(10.25rem+env(safe-area-inset-bottom))] lg:bottom-24"
          : "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-6"
      }`}
      title="Templates"
      aria-label="Open Templates"
    >
      <LayoutTemplate size={22} className="text-white" />

      {/* Hover label — desktop only, mirrors the tooltip pattern used for
          Access Requests so both buttons feel like one consistent system. */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:block">
        Templates
      </span>
    </button>
  );
}