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
      {/* Title + subtitle */}
      <h1 className="text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
        {title}
      </h1>
      <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
        {subtitle}
      </p>
    </div>
  );
}
