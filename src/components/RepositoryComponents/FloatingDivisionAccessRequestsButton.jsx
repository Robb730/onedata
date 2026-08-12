import { useEffect, useState } from "react";
import {
  fetchScopedDivisionRequests,
  canApproveDivisionAccessRequests,
} from "../../utils/divisionAccessRequestsApi";

export default function FloatingDivisionAccessRequestsButton({ userProfile, onClick, refreshKey }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-[0_12px_30px_rgba(37,99,235,0.35)] flex items-center justify-center transition-all hover:scale-105 lg:bottom-6 lg:right-6"
      title="Division Access Requests"
    >
      <lord-icon
        src={isHovered ? "/wired-outline-2722-logo-myspace-hover-pinch.json" : "/wired-outline-2722-logo-myspace-in-reveal.json"}
        trigger={isHovered ? "hover" : "in"}
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