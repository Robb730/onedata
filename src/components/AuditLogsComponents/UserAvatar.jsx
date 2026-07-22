import { getAvatarColor, getInitials } from "./auditLogsUtils";

/**
 * UserAvatar — Initials circle derived from an existing display name.
 * @param {string} name
 * @param {string} [className]
 */
export default function UserAvatar({ name, className = "" }) {
  if (!name) return null;

  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ${getAvatarColor(
        name
      )} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
