import {
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Users as UsersIcon,
  Mail,
  Building2,
  Hash,
} from "lucide-react";

const ROLE_ACCENT = {
  administrator: "from-blue-500 to-blue-600",
  division_focal: "from-violet-500 to-purple-600",
  section_focal: "from-emerald-500 to-teal-600",
  section_personnel: "from-amber-500 to-orange-500",
};

export default function UserCard({
  user,
  getRoleDisplay,
  getRoleBadgeColor,
  onViewLogs,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  showOrgPath = false,
}) {
  const roleLabel = getRoleDisplay(user.role);
  const isActive = user.status === "Active";
  const accent = ROLE_ACCENT[user.role] || "from-indigo-500 to-blue-600";
  const assignment =
    user.role === "administrator"
      ? "System-wide"
      : [user.division, user.section !== "—" ? user.section : null]
          .filter(Boolean)
          .join(" · ");

  return (
    <div
      onClick={() => onViewLogs(user)}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
        isActive
          ? "border border-slate-200/80 bg-white hover:border-slate-300"
          : "border border-orange-100 bg-orange-50/70 hover:border-orange-400 hover:shadow-[0_10px_24px_rgba(234,88,12,0.12)]"
      }`}
    >


      <div className="flex flex-1 flex-col px-3 py-2.5 sm:px-3.5 sm:py-3">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-[0.72rem] font-black text-white`}
            >
              {user.avatar}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isActive ? "bg-emerald-500" : "bg-orange-500"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[0.84rem] font-bold text-slate-800 leading-tight">
                {user.name}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {user.status}
              </span>
            </div>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${getRoleBadgeColor(
                user.role,
              )}`}
            >
              {user.role === "division_focal" || user.role === "administrator" ? (
                <Shield size={9} />
              ) : (
                <UsersIcon size={9} />
              )}
              {roleLabel}
            </span>
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-[0.7rem] font-medium text-slate-500">
              <Mail size={11} className="shrink-0 text-slate-400" />
              <span className="truncate">{user.email || "No email provided"}</span>
            </p>
            <p
              className="mt-0.5 flex items-center gap-1.5 truncate text-[0.7rem] font-medium text-slate-500"
              title={showOrgPath ? `${assignment} → ${roleLabel}` : assignment}
            >
              <Building2 size={11} className="shrink-0 text-slate-400" />
              <span className="truncate">{assignment}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.7rem] font-medium text-slate-500">
              <Hash size={11} className="shrink-0 text-slate-400" />
              <span className="truncate">{user.idNumber ?? "—"}</span>
            </p>
          </div>
        </div>

        <div
          className="mt-3 flex items-center justify-end gap-0.5 border-t border-slate-100 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onEdit(user)}
            title="Edit"
            className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit2 size={13} />
          </button>
          {isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate(user)}
              title="Deactivate"
              className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-600"
            >
              <UserX size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onActivate(user)}
              title="Activate"
              className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-md text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <UserCheck size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(user)}
            title="Delete"
            className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
