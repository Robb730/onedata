export function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function getPasswordStrength(password, checks) {
  if (password.length === 0) {
    return { label: "", color: "bg-slate-200", textColor: "text-slate-400", width: "0%" };
  }
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: "Weak", color: "bg-rose-500", textColor: "text-rose-500", width: "33%" };
  if (passed <= 4) return { label: "Medium", color: "bg-amber-500", textColor: "text-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500", width: "100%" };
}

export function getPasswordValidationError(password, confirmPassword) {
  const checks = getPasswordChecks(password);
  if (!checks.length) return "Password must be at least 8 characters.";
  if (!checks.uppercase) return "Password must include at least one uppercase letter.";
  if (!checks.lowercase) return "Password must include at least one lowercase letter.";
  if (!checks.number) return "Password must include at least one number.";
  if (!checks.special) return "Password must include at least one special character (e.g. !@#$%).";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
