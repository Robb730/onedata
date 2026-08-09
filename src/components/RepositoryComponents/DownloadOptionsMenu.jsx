import { useEffect, useRef } from "react";
import { Download, FileCheck2 } from "lucide-react";

// Small menu that appears anchored at the mouse click position.
// Usage: render conditionally when a target is set, pass the click
// coordinates captured on the download button's onClick.
export default function DownloadOptionsMenu({
  x,
  y,
  onDownloadRaw,
  onDownloadVerified,
  onClose,
}) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Keep the menu on-screen even if the click was near the viewport edge.
  const menuWidth = 220;
  const left = Math.min(x, window.innerWidth - menuWidth - 12);
  const top = Math.min(y, window.innerHeight - 120);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left, top, width: menuWidth, zIndex: 60 }}
      className="rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] overflow-hidden"
    >
      <button
        onClick={() => {
          onClose();
          onDownloadRaw();
        }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Download size={14} className="text-slate-400" />
        Download Raw File
      </button>
      <div className="h-px bg-slate-100" />
      <button
        onClick={() => {
          onClose();
          onDownloadVerified();
        }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
      >
        <FileCheck2 size={14} className="text-emerald-500" />
        Download Verified PDF
      </button>
    </div>
  );
}
