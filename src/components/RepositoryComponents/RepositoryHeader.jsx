/**
 * RepositoryHeader — Page-level header for the Data Repository.
 * Simple title + subtitle used across repository views.
 *
 * @param {string} [title]    — page heading
 * @param {string} [subtitle] — supporting description
 */
export function RepositoryHeader({
  title = "Data Repository",
  subtitle = "Central storage for all division folders and official documents",
}) {
  return (
    <div className="mb-7">
      <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        Repository
      </div>
      <h1 className="mt-4 text-[clamp(1.5rem,2.5vw,2.5rem)] font-black tracking-[-0.06em] text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[0.95rem]">
        {subtitle}
      </p>
    </div>
  );
}
