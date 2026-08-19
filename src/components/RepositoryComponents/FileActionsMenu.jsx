// FileActionsMenu.jsx
import { MessageSquare } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function FileActionsMenu({ x, y, onFeedback, feedbackCount, onClose }) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <div
          className="absolute w-48 rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)] py-1.5"
          style={{
            top: y,
            left: x,
            transform: "translate(-100%, -8px)", // opens leftward, nudged up to align with the kebab
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onFeedback();
              onClose();
            }}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <MessageSquare size={14} className="text-slate-400" />
              Feedback
            </span>
            {feedbackCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                {feedbackCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}