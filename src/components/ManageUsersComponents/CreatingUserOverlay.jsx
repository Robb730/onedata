import { useEffect, useState } from "react";
import { Mail, Send, UserCircle } from "lucide-react";

const STAGES = [
  "Creating account…",
  "Setting permissions…",
  "Sending credentials…",
];

/**
 * CreatingUserOverlay — cute busy state for AddNewUserModal.
 * Two layouts:
 *   overlay (default) → absolute cover over the form card with soft blur
 *   inline            → static centered content, used when the form fields
 *                       are hidden and loading is the only thing shown
 */
export default function CreatingUserOverlay({ email, inline = false }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={
        inline
          ? "flex flex-col items-center justify-center gap-5 px-6 text-center"
          : "absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-[24px] bg-white/75 px-6 text-center backdrop-blur-md"
      }
      role="status"
      aria-live="polite"
      aria-label="Creating user account"
    >
      {/* ── Cute animation: bobbing avatar + flying envelope ── */}
      <div className="relative h-24 w-44" aria-hidden="true">
        {/* soft glow blobs */}
        <div className="absolute left-1/2 top-1/2 h-20 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70 blur-2xl" />
        <div className="absolute left-8 top-2 h-10 w-10 rounded-full bg-emerald-100/60 blur-xl" />

        {/* dotted flight trail */}
        <div className="create-user-trail absolute left-12 right-10 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-300/80" />

        {/* avatar badge (the new user) */}
        <div className="create-user-avatar absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[14px] border border-blue-200/60 bg-blue-100 text-blue-600 shadow-[0_6px_20px_rgba(59,130,246,0.25)]">
          <UserCircle size={26} strokeWidth={2.25} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-white shadow">
            +
          </span>
        </div>

        {/* flying envelope */}
        <div className="create-user-envelope absolute top-1/2 -translate-y-1/2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-blue-600 shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
            <Mail size={20} strokeWidth={2.25} />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
              <Send size={10} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* sparkles */}
        <span className="create-user-spark create-user-spark-1 absolute right-6 top-3 h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="create-user-spark create-user-spark-2 absolute bottom-4 right-12 h-1 w-1 rounded-full bg-emerald-400" />
        <span className="create-user-spark create-user-spark-3 absolute right-14 top-5 h-1 w-1 rounded-full bg-blue-400" />
      </div>

      {/* ── Text ── */}
      <div>
        <p className="text-[0.95rem] font-black tracking-[-0.01em] text-slate-800">
          Creating user
          <span className="create-user-dots ml-1 inline-flex" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        <p
          key={stage}
          className="create-user-stage mt-1 min-h-5 text-[0.8rem] font-semibold text-slate-500"
        >
          {STAGES[stage]}
        </p>
        {email ? (
          <p className="mx-auto mt-2 max-w-60 truncate rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-blue-700">
            {email}
          </p>
        ) : null}
        <p className="mt-2 text-[0.68rem] font-medium text-slate-400">
          Please keep this window open.
        </p>
      </div>
    </div>
  );
}
