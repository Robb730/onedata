import {
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Users as UsersIcon,
  Mail,
} from "lucide-react";

const ROLE_ACCENT = {
  administrator: "from-blue-500 to-blue-600",
  division_focal: "from-violet-500 to-purple-600",
  section_focal: "from-emerald-500 to-teal-600",
  section_personnel: "from-amber-500 to-orange-500",
};

export default function UserRow({
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
  const orgPath = [
    user.division && user.division !== "Administrator" ? user.division : null,
    user.section && user.section !== "—" ? user.section : null,
    roleLabel,
  ]
    .filter(Boolean)
    .join(" → ");

  return (
    <div
      onClick={() => onViewLogs(user)}
      className={`group flex items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2.5 transition-colors cursor-pointer ${
        isActive
          ? "border border-slate-100 bg-white hover:bg-slate-50/80"
          : "border border-orange-100 bg-orange-50/70 hover:border-orange-400 hover:bg-orange-50"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-[0.7rem] font-black text-white`}
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
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-[0.8rem] sm:text-[0.84rem] font-semibold text-slate-800">
            {user.name}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.58rem] sm:text-[0.62rem] font-bold ${getRoleBadgeColor(
              user.role,
            )}`}
          >
            {user.role === "division_focal" || user.role === "administrator" ? (
              <Shield size={9} className="shrink-0" />
            ) : (
              <UsersIcon size={9} className="shrink-0" />
            )}
            {roleLabel}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.68rem] sm:text-[0.7rem] font-medium text-slate-400">
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{user.email || "No email provided"}</span>
          {showOrgPath && orgPath && (
            <span className="hidden sm:inline truncate" title={orgPath}>
              <span className="text-slate-300"> · </span>
              {orgPath}
            </span>
          )}
        </p>
      </div>

      <div
        className="flex items-center justify-end gap-0.5 sm:gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`mr-1 hidden rounded-full px-2 py-0.5 text-[0.62rem] font-bold lg:inline-flex ${
            isActive ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-600"
          }`}
        >
          {user.status}
        </span>
        <button
          type="button"
          onClick={() => onEdit(user)}
          title="Edit"
          className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600"
        >
          <Edit2 size={12} />
        </button>
        {isActive ? (
          <button
            type="button"
            onClick={() => onDeactivate(user)}
            title="Deactivate"
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-400 hover:text-amber-600"
          >
            <UserX size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onActivate(user)}
            title="Activate"
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600"
          >
            <UserCheck size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(user)}
          title="Delete"
          className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
