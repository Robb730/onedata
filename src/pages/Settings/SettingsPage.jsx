import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  Building2,
  Shield,
  Hash,
  Send,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { reauthenticate } from "../../utils/sectionDeletion";

const ROLE_LABELS = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",
  section_personnel: "Section Personnel",
  administrator: "Administrator",
};

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[0.92rem] font-bold text-slate-800 tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[0.72rem] font-medium text-slate-400">{description}</p>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function Field({ id, label, children }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.8rem] font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white";

export default function SettingsPage() {
  const { userProfile, refreshProfile } = useUser();

  const fullName = userProfile?.full_name ?? "";

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // NEW: tracks whether the entered "new email" already belongs to another
  // account, and whether that check is currently in flight.
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // NEW: debounced lookup against the users table whenever newEmail changes.
  useEffect(() => {
    const trimmed = newEmail.trim().toLowerCase();
    const currentEmail = (userProfile?.email ?? "").toLowerCase();

    if (!trimmed || !trimmed.includes("@") || trimmed === currentEmail) {
      setEmailTaken(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timeoutId = setTimeout(async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .ilike("email", trimmed)
        .neq("id", userProfile?.id ?? "")
        .maybeSingle();

      setCheckingEmail(false);
      if (!error) {
        setEmailTaken(!!data);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newEmail, userProfile?.email, userProfile?.id]);

  const roleLabel = ROLE_LABELS[userProfile?.role] ?? userProfile?.role ?? "—";
  const orgLabel =
    userProfile?.section?.name ||
    userProfile?.division?.name ||
    (userProfile?.role === "administrator" ? "System-wide" : "—");
  const initials = (userProfile?.full_name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  function showSuccess(message) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  async function logAudit({ action, details, status = "Success" }) {
    await supabase.from("audit_logs").insert({
      action,
      file_name: userProfile?.full_name ?? "Account",
      details,
      performed_by: userProfile?.full_name ?? "Unknown",
      role: roleLabel,
      status,
    });
  }

  async function handleSaveEmail(e) {
    e.preventDefault();
    setEmailError(null);
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (trimmed === (userProfile?.email ?? "").toLowerCase()) {
      setEmailError("That is already your current email.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Enter your current password to confirm.");
      return;
    }

    setSavingEmail(true);
    try {
      // Final authoritative check right before submitting, in case the
      // debounced background check hasn't resolved yet or is stale.
      const { data: existing, error: lookupError } = await supabase
        .from("users")
        .select("id")
        .ilike("email", trimmed)
        .neq("id", userProfile.id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (existing) {
        setEmailTaken(true);
        setEmailError("That email is already in use by another account.");
        setSavingEmail(false);
        return;
      }

      await reauthenticate(userProfile.email, emailPassword);
      const { error } = await supabase.functions.invoke("send-change-email", {
        body: { newEmail: trimmed },
      });
      if (error) throw error;
      await logAudit({
        action: "Edit",
        details: `Requested email change to ${trimmed}`,
      });
      setNewEmail("");
      setEmailPassword("");
      setEmailTaken(false);
      showSuccess("Confirmation link sent to your current email. Click it to finish the change.");
    } catch (err) {
      setEmailError(err.message || "Could not send confirmation email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSendResetLink() {
    setResetError(null);
    setSendingReset(true);
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: userProfile.email },
      });
      if (error) throw error;
      await logAudit({
        action: "Edit",
        details: "Requested password reset link",
      });
      setResetSent(true);
      showSuccess("Reset link sent to your email.");
    } catch (err) {
      setResetError(err.message || "Could not send reset link.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <div className="mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
            Settings
          </h1>
          <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1">
            Manage your profile, email, and password
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[0.78rem] font-black text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-bold text-slate-800">
                  {userProfile?.full_name ?? "—"}
                </p>
                <p className="truncate text-[0.72rem] font-medium text-slate-400">
                  {userProfile?.email ?? "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Shield size={13} className="shrink-0 text-blue-500" />
                <span className="truncate text-[0.72rem] font-semibold text-slate-600">{roleLabel}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Building2 size={13} className="shrink-0 text-indigo-500" />
                <span className="truncate text-[0.72rem] font-semibold text-slate-600">{orgLabel}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Hash size={13} className="shrink-0 text-slate-400" />
                <span className="truncate text-[0.72rem] font-semibold text-slate-600">
                  {userProfile?.id_number ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <SettingsCard
            icon={User}
            title="Display name"
            description="This name appears in the header, directory, and audit logs. Contact an administrator to change it."
          >
            <Field id="settings-name" label="Full name">
              <input
                id="settings-name"
                type="text"
                value={fullName}
                readOnly
                disabled
                className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
              />
            </Field>
          </SettingsCard>

          <SettingsCard
            icon={Mail}
            title="Email address"
            description="Used for login. Confirm with your current password."
          >
            <form onSubmit={handleSaveEmail} className="space-y-3">
              <Field id="settings-current-email" label="Current email">
                <input
                  id="settings-current-email"
                  type="email"
                  value={userProfile?.email ?? ""}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
                />
              </Field>
              <Field id="settings-new-email" label="New email">
                <input
                  id="settings-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClass} ${emailTaken ? "border-rose-300 focus:border-rose-400" : ""}`}
                  aria-invalid={emailTaken}
                />
              </Field>
              {checkingEmail && (
                <p className="text-[0.72rem] font-medium text-slate-400">Checking availability...</p>
              )}
              {!checkingEmail && emailTaken && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[0.75rem] font-medium text-rose-600">
                  That email is already in use by another account.
                </p>
              )}
              <Field id="settings-email-password" label="Current password">
                <input
                  id="settings-email-password"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Confirm with your password"
                  className={inputClass}
                  autoComplete="current-password"
                />
              </Field>
              {emailError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[0.75rem] font-medium text-rose-600">
                  {emailError}
                </p>
              )}
              <button
                type="submit"
                disabled={savingEmail || emailTaken || checkingEmail}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 text-[0.8rem] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEmail ? "Sending link..." : "Update email"}
              </button>
            </form>
          </SettingsCard>

          <SettingsCard
            icon={Lock}
            title="Password"
            description="For security, password changes are completed from a link sent to your email."
          >
            {resetSent ? (
              <div className="space-y-3">
                <p className="text-[0.8rem] font-medium text-slate-600">
                  A reset link was sent to{" "}
                  <span className="font-semibold text-slate-800">{userProfile?.email}</span>.
                  Open that email and continue on the change-password page.
                </p>
                <p className="text-[0.72rem] font-medium text-slate-400">
                  Email sending will be connected by the backend. Use the preview below to review the panel.
                </p>
                <Link
                  to="/change-password"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 text-[0.8rem] font-semibold text-white hover:bg-blue-700"
                >
                  Open change-password panel
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[0.8rem] font-medium text-slate-600">
                  We never change your password from this screen. A one-time link goes to your account email so only you can set a new password.
                </p>
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  disabled={sendingReset}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[0.8rem] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sendingReset ? "Sending..." : "Send reset link"}
                </button>
              </div>
            )}
          </SettingsCard>
        </div>
      </div>

      <div
        className={`fixed left-4 right-4 z-50 flex bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 sm:left-auto sm:right-6 sm:w-[380px] ${
          showToast
            ? "translate-y-0 sm:translate-x-0 opacity-100 pointer-events-auto"
            : "translate-y-4 sm:translate-y-0 sm:translate-x-[120%] opacity-0 pointer-events-none"
        }`}
        style={{
          maxWidth: "380px",
          marginLeft: "auto",
          height: "76px",
          borderRadius: "16px",
          boxShadow: showToast
            ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
            : "0 12px 30px rgba(0,0,0,0)",
          border: "1px solid rgba(241, 245, 249, 1)",
        }}
      >
        <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-emerald-100/60 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-1 items-center gap-4 px-5">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900 leading-tight">Success</p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-500">{toastMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}