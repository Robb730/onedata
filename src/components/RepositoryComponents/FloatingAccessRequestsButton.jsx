// FloatingAccessRequestsButton.jsx
// Renders bottom-right, only inside the Repository folder detail page, and
// only for roles that can approve access requests (section_focal,
// division_focal, admin). Badge shows the live pending count for whatever
// this user is scoped to see.
//
// This is the "base" floating button in the stack — FloatingTemplatesButton
// docks directly above it when both are visible, and falls back to this
// same base position when this button isn't rendered for the current role.

import { useEffect, useState } from "react";
import { fetchScopedRequests, canApproveAccessRequests } from "../../utils/accessRequestsApi";

export default function FloatingAccessRequestsButton({ userProfile, sectionId, onClick, refreshKey }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!canApproveAccessRequests(userProfile)) return;
    let cancelled = false;
    fetchScopedRequests(userProfile, sectionId)
      .then((data) => {
        if (!cancelled) {
          setPendingCount(data.filter((r) => r.status === "pending").length);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
    // refreshKey lets the parent force a re-poll after approve/deny/revoke
    // or after a new request comes in, without a full realtime subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, sectionId, refreshKey]);

  if (!canApproveAccessRequests(userProfile)) return null;

  return (
    <button
      onClick={onClick}
      className="group fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition-all hover:scale-105 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 lg:bottom-6 lg:right-6"
      title="Access Requests"
      aria-label="Open Access Requests"
    >
      <lord-icon
        src="/wired-outline-966-file-policy-hover-swipe.json"
        trigger="hover"
        stroke="bold"
        colors="primary:#ffffff,secondary:#ffffff"
        style={{ width: "28px", height: "28px" }}
      ></lord-icon>

      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-bold text-white">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}

      {/* Hover label — desktop only, mirrors FloatingTemplatesButton */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:block">
        Access Requests
      </span>
    </button>
  );
}