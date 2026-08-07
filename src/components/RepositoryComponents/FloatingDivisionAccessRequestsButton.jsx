import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  fetchScopedDivisionRequests,
  canApproveDivisionAccessRequests,
} from "../../utils/divisionAccessRequestsApi";

export default function FloatingDivisionAccessRequestsButton({ userProfile, onClick, refreshKey }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!canApproveDivisionAccessRequests(userProfile)) return;
    let cancelled = false;
    fetchScopedDivisionRequests(userProfile)
      .then((data) => {
        if (!cancelled) setPendingCount(data.filter((r) => r.status === "pending").length);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, refreshKey]);

  if (!canApproveDivisionAccessRequests(userProfile)) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 shadow-[0_12px_30px_rgba(124,58,237,0.35)] flex items-center justify-center transition-all hover:scale-105"
      title="Division Access Requests"
    >
      <Users size={22} className="text-white" />
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </button>
  );
}