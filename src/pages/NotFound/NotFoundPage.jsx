import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
        <ShieldAlert size={26} className="text-rose-500" />
      </div>
      <h1 className="text-[1.3rem] font-black text-slate-800">Page not found</h1>
      <p className="mt-1.5 max-w-sm text-[0.85rem] text-slate-500">
        This page doesn't exist, or you don't have permission to view it.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-[10px] bg-blue-500 px-4 py-2 text-[0.82rem] font-semibold text-white hover:bg-blue-600 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}