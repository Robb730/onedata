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
    <div className="mb-6">
      {/* Title + subtitle */}
      <h1 className="text-3xl font-semibold text-slate-900 leading-tight tracking-tight" style={{ marginBottom: '6px' }}>
        {title}
      </h1>
      <p className="text-slate-500 mt-0 text-sm leading-relaxed max-w-xl">
        {subtitle}
      </p>
    </div>
  );
}
