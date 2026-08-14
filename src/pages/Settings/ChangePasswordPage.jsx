import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Check, X, CheckCircle, AlertTriangle } from "lucide-react";
import logo from "../../assets/one-data-logo.png";
import { supabase } from "../../lib/supabaseClient";
import {
  getPasswordChecks,
  getPasswordStrength,
  getPasswordValidationError,
} from "../../utils/passwordRules";

function RequirementItem({ met, label }) {
  return (
    <li className={`flex items-center gap-1 text-xs ${met ? "text-emerald-600" : "text-slate-400"}`}>
      {met ? <Check size={12} /> : <X size={12} />}
      {label}
    </li>
  );
}

export default function ChangePasswordPage() {
  // "loading" | "ready" | "invalid"
  const [status, setStatus] = useState("loading");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const strength = useMemo(() => getPasswordStrength(newPassword, checks), [newPassword, checks]);
  const allChecksPassed = Object.values(checks).every(Boolean);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const queryParams = new URLSearchParams(window.location.search);
    const looksLikeRecovery =
      hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    // In case the client already processed the redirect before this effect ran
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((prev) => {
        if (prev !== "loading") return prev;
        if (session) return "ready";
        return looksLikeRecovery ? "loading" : "invalid";
      });
    });

    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "invalid" : prev));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = getPasswordValidationError(newPassword, confirmPassword);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message || "Could not update password.");
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
  };

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-6 sm:p-4"
      style={{
        background: "linear-gradient(-45deg, #c9defa, #dce8fa, #e3f0fd, #d8f0ea, #c4e8dc, #d4e6f9)",
        backgroundSize: "400% 400%",
        animation: "subtleGradientMove 18s ease infinite",
      }}
    >
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[22rem] w-[22rem] sm:h-[34rem] sm:w-[34rem] rounded-full blur-3xl opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(41, 134, 232, 0.45) 0%, rgba(26, 111, 224, 0.25) 45%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[24rem] w-[24rem] sm:h-[38rem] sm:w-[38rem] rounded-full blur-3xl opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(39, 174, 122, 0.42) 0%, rgba(29, 170, 116, 0.22) 45%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 sm:p-8"
        style={{
          boxShadow: "0 25px 60px rgba(15,50,100,0.12), 0 8px 24px rgba(15,50,100,0.08)",
        }}
      >
        <div className="mb-5 flex flex-col items-center">
          <img src={logo} alt="OneData" className="h-11 w-auto" />
          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <Lock size={22} className="text-blue-600" />
          </div>
          <h1 className="mt-3 text-center text-xl font-bold text-slate-800">
            Set a new password
          </h1>
          <p className="mt-1 text-center text-[0.78rem] font-medium text-slate-400">
            This link was opened from your account email. Choose a strong password to protect confidential records.
          </p>
        </div>

        {status === "loading" && (
          <p className="text-center text-[0.8rem] font-medium text-slate-400">Verifying your link…</p>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle size={22} className="text-rose-500" />
            </div>
            <p className="text-[0.9rem] font-bold text-slate-800">Link expired or invalid</p>
            <p className="mt-1 text-[0.75rem] font-medium text-slate-400">
              Request a new reset link from the Settings page and try again.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 text-[0.8rem] font-semibold text-white hover:bg-blue-700"
            >
              Back to login
            </Link>
          </div>
        )}

        {status === "ready" && done && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <p className="text-[0.9rem] font-bold text-slate-800">Password updated</p>
            <p className="mt-1 text-[0.75rem] font-medium text-slate-400">
              You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 text-[0.8rem] font-semibold text-white hover:bg-blue-700"
            >
              Back to login
            </Link>
          </div>
        )}

        {status === "ready" && !done && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-[0.8rem] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className={`mt-1 text-xs font-medium ${newPassword.length === 0 ? "text-slate-300" : strength.textColor}`}>
                  {newPassword.length === 0 ? "Enter a password" : strength.label}
                </p>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                <RequirementItem met={checks.length} label="8+ characters" />
                <RequirementItem met={checks.uppercase} label="Uppercase letter" />
                <RequirementItem met={checks.lowercase} label="Lowercase letter" />
                <RequirementItem met={checks.number} label="Number" />
                <RequirementItem met={checks.special} label="Special character" />
              </ul>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-[0.8rem] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`mt-1 text-xs ${newPassword === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                  {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !allChecksPassed}
              className="min-h-[44px] rounded-xl bg-blue-600 text-[0.8rem] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Set new password"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes subtleGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}