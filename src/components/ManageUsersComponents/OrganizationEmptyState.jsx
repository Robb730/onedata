import { Users } from "lucide-react";

export default function OrganizationEmptyState({ title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
      <Users className="mx-auto mb-2 text-slate-300" size={22} strokeWidth={1.5} />
      <p className="text-[0.8rem] font-semibold text-slate-600">{title}</p>
      {message && (
        <p className="mt-0.5 text-[0.72rem] font-medium text-slate-400">{message}</p>
      )}
    </div>
  );
}
