// src/components/ChangePasswordModal.jsx
import { useState, useMemo } from "react";
import { Eye, EyeOff, Lock, Check, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getStrength(password, checks) {
  if (password.length === 0) {
    return { label: "", color: "bg-slate-200", textColor: "text-slate-400", width: "0%" };
  }
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: "Weak", color: "bg-rose-500", textColor: "text-rose-500", width: "33%" };
  if (passed <= 4) return { label: "Medium", color: "bg-amber-500", textColor: "text-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500", width: "100%" };
}

export function ChangePasswordModal({ isOpen, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const strength = useMemo(() => getStrength(newPassword, checks), [newPassword, checks]);
  const allChecksPassed = Object.values(checks).every(Boolean);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!checks.length) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!checks.uppercase) {
      setError("Password must include at least one uppercase letter.");
      return;
    }
    if (!checks.lowercase) {
      setError("Password must include at least one lowercase letter.");
      return;
    }
    if (!checks.number) {
      setError("Password must include at least one number.");
      return;
    }
    if (!checks.special) {
      setError("Password must include at least one special character (e.g. !@#$%).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("users")
      .update({ must_change_password: false })
      .eq("id", user.id);

    setLoading(false);
    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Lock size={26} className="text-blue-600" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-slate-800 mb-1">
          Change Your Password
        </h2>
        <p className="text-center text-sm text-slate-400 mb-6">
          You're using a temporary password. Please set a new one to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

            {/* Strength meter — always visible, empty state until typing starts */}
            <div className="mt-1">
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${newPassword.length === 0 ? "text-slate-300" : strength.textColor}`}>
                {newPassword.length === 0 ? "Enter a password" : strength.label}
              </p>
            </div>

            {/* Requirement checklist — always visible */}
            <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
              <RequirementItem met={checks.length} label="8+ characters" />
              <RequirementItem met={checks.uppercase} label="Uppercase letter" />
              <RequirementItem met={checks.lowercase} label="Lowercase letter" />
              <RequirementItem met={checks.number} label="Number" />
              <RequirementItem met={checks.special} label="Special character" />
            </ul>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
              <p className={`text-xs mt-1 ${newPassword === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !allChecksPassed}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RequirementItem({ met, label }) {
  return (
    <li className={`flex items-center gap-1 text-xs ${met ? "text-emerald-600" : "text-slate-400"}`}>
      {met ? <Check size={12} /> : <X size={12} />}
      {label}
    </li>
  );
}