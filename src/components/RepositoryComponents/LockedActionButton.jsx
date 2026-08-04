import { Lock } from "lucide-react";

/**
 * Grayed-out, disabled stand-in for an action button (view/download/edit/delete)
 * when the user doesn't have access to this section. Shows a tooltip on hover.
 */
export default function LockedActionButton({ label = "Locked", size = 14 }) {
  return (
    <div className="relative group/locked">
      <button
        disabled
        className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
      >
        <Lock size={size} />
      </button>
      <span className="pointer-events-none absolute bottom-full right-0 mb-1 hidden group-hover/locked:block whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg z-10">
        {label}
      </span>
    </div>
  );
}