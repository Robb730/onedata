import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * RepositoryBackButton — consistent back button used across repository views.
 * Props: `to` (string) or `onClick` (function) and optional `label`.
 */
export function RepositoryBackButton({ to, onClick, label = "Repository", className = "" }) {
  const navigate = useNavigate();

  function handleClick(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (onClick) return onClick();
    if (to) return navigate(to);
    return navigate("/repository");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors ${className}`}
    >
      <ChevronLeft size={16} />
      <span>{label}</span>
    </button>
  );
}

export default RepositoryBackButton;
