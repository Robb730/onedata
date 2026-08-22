import React, { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";
import { LoginFormInput } from "./LoginFormInput";
import { LoginButton } from "./LoginButton";
import { LoginCheckbox } from "./LoginCheckbox";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import ForgotPasswordModal from "./ForgotPasswordModal";

// After this many consecutive failed logins for the same account,
// a "Security Alert" audit log entry is raised for admins to review.
const FAILED_LOGIN_ALERT_THRESHOLD = 5;

/**
 * LoginForm — Right-side form panel with top-right floating notification overlay
 * that automatically closes after 5 seconds.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [notification, setNotification] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
    const { setUserProfile, refreshProfile } = useUser();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Auto-dismiss notification overlay after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const triggerError = (msg) => {
    setNotification(msg);
    setIsExiting(false);
  };

  const dismissNotification = () => {
    setIsExiting(true);
    setTimeout(() => {
      setNotification(null);
      setIsExiting(false);
    }, 350);
  };

  // ─── Audit logging helpers ─────────────────────────────────
  async function logLoginAudit({ action, details, performedBy, role, status }) {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: performedBy ?? "Unknown",
      details,
      performed_by: performedBy ?? "Unknown",
      role: role ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log insert failed:", error.message);
  }

  // Counts how many "Login Failed" attempts have happened in a row for this
  // email, most recent first, stopping as soon as a "Login Success" (or an
  // unrelated log) is hit. Includes the attempt that was just logged.
  // Counts how many "Login Failed" attempts have happened in a row for this
  // email, most recent first, stopping as soon as a "Login Success" is hit.
  async function getConsecutiveFailedCount(emailValue) {
    const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // last 30 min

    const { data, error } = await supabase
      .from("audit_logs")
      .select("action, performed_on")
      .eq("performed_by", emailValue)
      .in("action", ["Login Failed", "Login Success"])
      .gte("performed_on", windowStart)
      .order("performed_on", { ascending: false });

    if (error) {
      console.error("Failed to check login attempt history:", error.message);
      return 0;
    }

    let count = 0;
    for (const log of data) {
      if (log.action === "Login Success") break; // streak resets here
      count++;
    }
    return count;
  }

  async function handleFailedLogin(emailValue, reason) {
    await logLoginAudit({
      action: "Login Failed",
      details: reason,
      performedBy: emailValue,
      role: "Unknown",
      status: "Failed",
    });

    const consecutiveFailures = await getConsecutiveFailedCount(emailValue);

    if (consecutiveFailures >= FAILED_LOGIN_ALERT_THRESHOLD) {
      const { data: userRow } = await supabase
        .from("users")
        .select("id, full_name, role, is_active")
        .eq("email", emailValue)
        .maybeSingle();

      // Only act if the account exists and isn't already locked/inactive
      if (userRow?.is_active) {
        await supabase
          .from("users")
          .update({ is_active: false })
          .eq("id", userRow.id);

        await logLoginAudit({
          action: "Security Alert",
          details: `Account automatically locked after ${consecutiveFailures} consecutive failed login attempts. Review before reactivating.`,
          performedBy: emailValue,
          role: userRow.role,
          status: "Pending",
        });
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError(false);
    setPasswordError(false);

    // Client-side validation
    if (!email.trim() && !password.trim()) {
      triggerError("Please enter your email address and password.");
      setEmailError(true);
      setPasswordError(true);
      return;
    }

    if (!email.trim()) {
      triggerError("Please enter your email address.");
      setEmailError(true);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      triggerError("Please enter a valid email address.");
      setEmailError(true);
      return;
    }

    if (!password) {
      triggerError("Please enter your password.");
      setPasswordError(true);
      return;
    }

    const trimmedEmail = email.trim();
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError) {
      setLoading(false);
      setEmailError(true);
      setPasswordError(true);

      const reason =
        authError.message || "Failed to log in. Please check your credentials.";
      await handleFailedLogin(trimmedEmail, reason);

      if (
        authError.message.toLowerCase().includes("invalid login credentials")
      ) {
        triggerError(
          "Incorrect email or password. Please verify your details and try again.",
        );
      } else {
        triggerError(reason);
      }
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, full_name, role, must_change_password, is_active")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      await handleFailedLogin(
        trimmedEmail,
        userError.message || "Error retrieving user profile.",
      );
      triggerError(userError.message || "Error retrieving user profile.");
      setLoading(false);
      return;
    }

    if (!userData.is_active) {
      await supabase.auth.signOut();
      await logLoginAudit({
        action: "Login Failed",
        details: "Login attempt on a deactivated account.",
        performedBy: trimmedEmail,
        role: userData.role,
        status: "Failed",
      });
      triggerError(
        "This account has been deactivated. Please contact your administrator.",
      );
      setEmailError(true);
      setPasswordError(true);
      setLoading(false);
      return;
    }

    // Successful login — resets the consecutive-failure streak since the
    // next lookup will stop as soon as it hits this "Login Success" row.
    await logLoginAudit({
      action: "Login Success",
      details: "Logged in successfully.",
      performedBy: trimmedEmail,
      role: userData.role,
      status: "Success",
    });

    await supabase
      .from("audit_logs")
      .update({
        status: "Success",
        details: "Resolved automatically after a successful login.",
      })
      .eq("performed_by", trimmedEmail)
      .eq("action", "Security Alert")
      .eq("status", "Pending");

    await refreshProfile();

    navigate("/dashboard", { state: { justLoggedIn: true } });
    setLoading(false);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(false);
  };

  return (
    <div className="relative flex flex-1 flex-col justify-center px-5 py-6 sm:px-8 sm:py-10 lg:px-12">
      {/* ========================================================= */}
      {/* Floating Top-Right Notification Overlay */}
      {/* ========================================================= */}
      {notification && (
        <div
          className={`fixed top-4 right-4 left-4 z-50 flex max-w-sm sm:left-auto sm:w-[90vw] items-start gap-3 rounded-2xl border border-rose-200/90 bg-white/95 p-4 text-rose-900 shadow-[0_20px_50px_rgba(225,29,72,0.18),0_8px_20px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-350 ease-in-out ${
            isExiting
              ? "opacity-0 translate-x-12 scale-95 pointer-events-none"
              : "opacity-100 translate-x-0 scale-100 animate-[toastPopRight_0.4s_cubic-bezier(0.16,1,0.3,1)]"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-sm mt-0.5">
            <AlertCircle size={20} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-rose-950">Login Failed</h4>
            <p className="mt-0.5 text-xs text-rose-700 font-medium leading-relaxed">
              {notification}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissNotification}
            className="shrink-0 rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <h1
          className="text-[1.6rem] sm:text-[1.9rem] font-extrabold tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, #1a6fe0 0%, #2986e8 60%, #1daa74 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome!
        </h1>
        <p className="mt-1.5 text-[0.85rem] text-gray-400 font-medium">
          Log in to access your account.
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email */}
        <LoginFormInput
          id="login-email"
          label="Email:"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          autoComplete="email"
          hasError={emailError}
        />

        {/* Password */}
        <LoginFormInput
          id="login-password"
          label="Password:"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          hasError={passwordError}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="outline-none cursor-pointer p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Stay logged in */}
        <LoginCheckbox
          id="login-stay-logged-in"
          label="Stay logged in"
          checked={stayLoggedIn}
          onChange={() => setStayLoggedIn((v) => !v)}
        />

        {/* Submit */}
        <div className="mt-1">
          <LoginButton loading={loading} />
        </div>

        {/* Forgot password link */}
<p className="text-center">
  <button
    type="button"
    id="login-forgot-password"
    onClick={() => setShowForgotPassword(true)}
    className="text-[0.82rem] font-semibold text-[#2986e8] hover:text-[#1565c0] transition-colors relative
               after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[#2986e8] after:transition-all after:duration-300
               hover:after:w-full"
  >
    Forgot password?
  </button>
</p>
      </form>

      {/* Footer */}
      <p className="mt-auto pt-5 sm:pt-6 text-center text-xs text-gray-300 tracking-widest font-medium">
        OneData © {new Date().getFullYear()}
      </p>

      {/* Keyframes for right-side pop entrance */}
      {/* Keyframes for right-side pop entrance */}
      <style>{`
        @keyframes toastPopRight {
          0% {
            opacity: 0;
            transform: translateX(40px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    

      <style>{`
        @keyframes toastPopRight {
          0% {
            opacity: 0;
            transform: translateX(40px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
