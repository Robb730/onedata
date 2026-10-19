import { useEffect, useState } from "react";
import { Trash2, UserX } from "lucide-react";

const STAGES = [
  "Detaching reviews…",
  "Clearing requests…",
  "Deleting account…",
];

/**
 * DeletingUserOverlay — cute loading-only busy state for
 * DeleteConfirmationModal. Trash-themed to match the red delete modal:
 * a user badge tips into a trash bin with soft poof dots, plus rotating
 * staged messages mirroring the delete-user edge-function steps.
 */
export default function DeletingUserOverlay({ userName }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 px-6 text-center"
      role="status"
      aria-live="polite"
      aria-label="Deleting user account"
    >
      {/* ── Cute animation: avatar tipping into trash ── */}
      <div className="relative h-24 w-44" aria-hidden="true">
        {/* soft glow blobs */}
        <div className="absolute left-1/2 top-1/2 h-20 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-100/70 blur-2xl" />
        <div className="absolute right-8 top-2 h-10 w-10 rounded-full bg-amber-100/60 blur-xl" />

        {/* dotted drop trail */}
        <div className="delete-user-trail absolute bottom-8 left-1/2 top-6 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-red-300/80" />

        {/* trash bin */}
        <div className="absolute bottom-1 left-1/2 flex h-12 w-14 -translate-x-1/2 items-center justify-center rounded-b-[14px] rounded-t-[6px] border border-red-200/70 bg-red-50 text-red-500 shadow-[0_6px_20px_rgba(239,68,68,0.22)]">
          <Trash2 size={24} strokeWidth={2.25} />
          {/* lid */}
          <div className="delete-user-lid absolute -top-2 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-red-200" />
        </div>

        {/* falling avatar badge */}
        <div className="delete-user-avatar absolute left-1/2 top-0 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
          <UserX size={20} strokeWidth={2.25} />
        </div>

        {/* poof dots */}
        <span className="delete-user-poof delete-user-poof-1 absolute bottom-6 left-14 h-1.5 w-1.5 rounded-full bg-red-300" />
        <span className="delete-user-poof delete-user-poof-2 absolute bottom-8 right-14 h-1 w-1 rounded-full bg-amber-400" />
        <span className="delete-user-poof delete-user-poof-3 absolute bottom-4 right-16 h-1 w-1 rounded-full bg-red-400" />
      </div>

      {/* ── Text ── */}
      <div>
        <p className="text-[0.95rem] font-black tracking-[-0.01em] text-slate-800">
          Deleting user
          <span className="delete-user-dots ml-1 inline-flex" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        <p
          key={stage}
          className="delete-user-stage mt-1 min-h-5 text-[0.8rem] font-semibold text-slate-500"
        >
          {STAGES[stage]}
        </p>
        {userName ? (
          <p className="mx-auto mt-2 max-w-60 truncate rounded-lg border border-red-100 bg-red-50/70 px-3 py-1.5 text-[0.7rem] font-semibold text-red-700">
            {userName}
          </p>
        ) : null}
        <p className="mt-2 text-[0.68rem] font-medium text-slate-400">
          Please keep this window open.
        </p>
      </div>
    </div>
  );
}
