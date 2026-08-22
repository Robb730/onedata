import {
  Upload,
  Download,
  CheckCircle,
  Trash2,
  Edit,
  UserPlus,
  Shield,
  FileText,
  RefreshCw,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";

/** Stable avatar color from a name (presentation only). */
export function getAvatarColor(name = "") {
  const palette = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-orange-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/** Split existing `performedOn` strings like "Feb 24, 2026 10:30 AM". */
// auditLogsUtils.js
export function parsePerformedOn(performedOn) {
  if (!performedOn) return { date: "—", time: "" };

  const d = new Date(performedOn);
  if (isNaN(d.getTime())) return { date: "—", time: "" };

  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export function getActionMeta(action) {
  const map = {
    Upload: {
      icon: Upload,
      className: "bg-blue-50 text-blue-700 border-blue-100",
      iconClass: "text-blue-600",
    },
    Download: {
      icon: Download,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      iconClass: "text-emerald-600",
    },
    Verify: {
      icon: CheckCircle,
      className: "bg-cyan-50 text-cyan-700 border-cyan-100",
      iconClass: "text-cyan-600",
    },
    Delete: {
      icon: Trash2,
      className: "bg-rose-50 text-rose-700 border-rose-100",
      iconClass: "text-rose-600",
    },
    "Login Failed": {
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-100",
      iconClass: "text-rose-600",
    },
    "Security Alert": {
      icon: AlertTriangle,
      className: "bg-rose-50 text-rose-700 border-rose-100",
      iconClass: "text-rose-600",
    },
    Edit: {
      icon: Edit,
      className: "bg-amber-50 text-amber-700 border-amber-100",
      iconClass: "text-amber-600",
    },
    "Role Change": {
      icon: RefreshCw,
      className: "bg-violet-50 text-violet-700 border-violet-100",
      iconClass: "text-violet-600",
    },
    "Access Request": {
      icon: Shield,
      className: "bg-yellow-50 text-yellow-700 border-yellow-100",
      iconClass: "text-yellow-600",
    },
    "Access Grant": {
      icon: Shield,
      className: "bg-green-50 text-green-700 border-green-100",
      iconClass: "text-green-600",
    },
  };

  return (
    map[action] || {
      icon: FileText,
      className: "bg-slate-50 text-slate-700 border-slate-100",
      iconClass: "text-slate-600",
    }
  );
}

export function getStatusMeta(status) {
  const map = {
    Success: {
      icon: CheckCircle,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    Failed: {
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-100",
    },
    Pending: {
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-100",
    },
    Information: {
      icon: Info,
      className: "bg-sky-50 text-sky-700 border-sky-100",
    },
    Warning: {
      icon: AlertTriangle,
      className: "bg-orange-50 text-orange-700 border-orange-100",
    },
  };

  return (
    map[status] || {
      icon: Info,
      className: "bg-slate-50 text-slate-600 border-slate-100",
    }
  );
}
