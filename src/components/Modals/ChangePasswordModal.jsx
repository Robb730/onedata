// src/components/ChangePasswordModal.jsx
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export function ChangePasswordModal({ isOpen, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Step 1: Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Step 2: Flip the flag in your users table
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("users")
      .update({ must_change_password: false })
      .eq("id", user.id);

    setLoading(false);
    onSuccess(); // close modal and continue
  };

  return (
    // Backdrop — no close on click outside, they MUST change it
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Lock size={26} className="text-blue-600" />
          </div>
        </div>

        {/* Header */}
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
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}