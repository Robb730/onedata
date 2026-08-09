// FloatingAccessRequestsButton.jsx
// Renders bottom-right, only inside the Repository folder detail page, and
// only for roles that can approve access requests (section_focal,
// division_focal, admin). Badge shows the live pending count for whatever
// this user is scoped to see.

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { fetchScopedRequests, canApproveAccessRequests } from "../../utils/accessRequestsApi";

export default function FloatingAccessRequestsButton({ userProfile, onClick, refreshKey }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!canApproveAccessRequests(userProfile)) return;
    let cancelled = false;
    fetchScopedRequests(userProfile)
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
  }, [userProfile, refreshKey]);

  if (!canApproveAccessRequests(userProfile)) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-[0_12px_30px_rgba(37,99,235,0.35)] flex items-center justify-center transition-all hover:scale-105"
      title="Access Requests"
    >
      <lord-icon
        src="/wired-outline-966-file-policy-hover-swipe.json"
        trigger="hover"
        stroke="bold"
        colors="primary:#ffffff,secondary:#ffffff"
        style={{ width: "28px", height: "28px" }}
      ></lord-icon>
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </button>
  );
}
