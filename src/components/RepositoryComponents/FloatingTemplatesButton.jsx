// FloatingTemplatesButton.jsx
// Renders a floating "+" button (bottom-left) on the Repository Folder Detail
// page. Only visible to division_focal, section_focal, and section_personnel.
// Clicking it opens the TemplatesModal for the user's assigned section/division.

import { LayoutTemplate } from "lucide-react";
import { ROLES } from "../../utils/accessControl";

const TEMPLATE_VISIBLE_ROLES = [
  ROLES.DIVISION_FOCAL,
  ROLES.SECTION_FOCAL,
  ROLES.PERSONNEL,
];

export default function FloatingTemplatesButton({ userProfile, onClick }) {
  if (!TEMPLATE_VISIBLE_ROLES.includes(userProfile?.role)) return null;

  return (
    <button
      id="floating-templates-btn"
      onClick={onClick}
      className="fixed bottom-[calc(10.25rem+env(safe-area-inset-bottom))] right-4 z-30 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-[0_12px_30px_rgba(5,150,105,0.35)] flex items-center justify-center transition-all hover:scale-105 lg:bottom-[6rem] lg:right-6"
      title="Templates"
      aria-label="Open Templates"
    >
      <LayoutTemplate size={22} className="text-white" />
    </button>
  );
}
