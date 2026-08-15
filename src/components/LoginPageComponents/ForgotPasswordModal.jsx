import { useState } from "react";
import { X, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const resetAndClose = () => {
    setEmail("");
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    // Only client-side format validation is checked before showing the
    // generic "sent" state below — this alone isn't a real enumeration
    // signal since it never touches the database.
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      // Look up the account, but never branch the UI on the result —
      // only whether we attempt the send is conditional, not what the
      // person sees afterward. This avoids using this form to enumerate
      // which emails exist in the system.
      const { data: userRow, error: lookupError } = await supabase
        .from("users")
        .select("id, email")
        .ilike("email", trimmedEmail)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (userRow) {
        const { error } = await supabase.functions.invoke("send-password-reset", {
          body: { email: userRow.email },
        });
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "Edit",
          file_name: userRow.email,
          details: `Password reset link requested from login screen (${userRow.email})`,
          performed_by: userRow.email,
          role: "Unknown",
          status: "Success",
        });
      }
      // If userRow is null, we deliberately do nothing further — no send,
      // no audit log — but the UI still proceeds to the same "sent" state.

      setStatus("sent");
    } catch (err) {
      // Only genuine failures (network/DB/function errors) reach this
      // branch — never "email not found," so the error state can't be
      // used to distinguish a bad email from a real outage.
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again in a moment.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] border border-slate-100">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[0.95rem] font-bold text-slate-800">Reset your password</h2>
            <p className="mt-0.5 text-[0.72rem] font-medium text-slate-400">
              Enter your account email and we'll send you a reset link.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {status === "sent" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[0.85rem] font-semibold text-slate-800">Check your inbox</p>
                <p className="mt-1 text-[0.75rem] font-medium text-slate-500 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-700">{email.trim()}</span>,
                  a reset link has been sent. Follow it to set a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="inline-flex min-h-[42px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-[0.8rem] font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <label htmlFor="forgot-password-email" className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                  Email
                </span>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={`w-full min-h-[44px] rounded-xl border bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-[0.8rem] font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                      status === "error"
                        ? "border-rose-300 focus:border-rose-400"
                        : "border-slate-200/80 focus:border-blue-500"
                    }`}
                  />
                </div>
              </label>

              {status === "error" && (
                <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[0.75rem] font-medium text-rose-600">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[0.8rem] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {status === "sending" ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}