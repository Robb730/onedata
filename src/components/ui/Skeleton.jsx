import { motion } from "motion/react";
import { clsx } from "clsx";

const PULSE = {
  animate: { opacity: [0.45, 1, 0.45] },
  transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
};

/**
 * Skeleton — subtle fade-pulse placeholder block (motion.dev).
 * Honors prefers-reduced-motion via the root MotionConfig.
 */
export function Skeleton({ className, rounded = "rounded-lg", label = "Loading" }) {
  return (
    <motion.div
      role="status"
      aria-label={label}
      initial={{ opacity: 0.45 }}
      animate={PULSE.animate}
      transition={PULSE.transition}
      className={clsx("bg-slate-200/80", rounded, className)}
    />
  );
}

/** Stacked text-line placeholders. */
export function SkeletonText({ lines = 3, className, lineClassName, label }) {
  return (
    <div className={clsx("space-y-2", className)} role="status" aria-label={label || "Loading"}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.45 }}
          animate={PULSE.animate}
          transition={{ ...PULSE.transition, delay: i * 0.08 }}
          className={clsx(
            "h-3 bg-slate-200/80 rounded-md",
            i === lines - 1 && "w-2/3",
            lineClassName
          )}
        />
      ))}
    </div>
  );
}

/** Card-grid placeholder (e.g. dashboard overview cards). */
export function SkeletonCards({ count = 4, className, cardClassName }) {
  return (
    <div className={clsx("grid grid-cols-2 lg:grid-cols-4 gap-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={clsx("rounded-2xl border border-slate-200/60 bg-white p-4 space-y-3", cardClassName)}>
          <Skeleton className="h-3 w-1/2" rounded="rounded-md" />
          <Skeleton className="h-7 w-3/4" rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Chart-area placeholder. */
export function SkeletonChart({ className, height = "h-[220px]" }) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200/60 bg-white p-4", className)} role="status" aria-label="Loading chart">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3.5 w-32" rounded="rounded-md" />
        <Skeleton className="h-6 w-20" rounded="rounded-full" />
      </div>
      <Skeleton className={clsx("w-full", height)} rounded="rounded-xl" />
    </div>
  );
}

/** Table placeholder with header + N body rows. */
export function SkeletonTable({ rows = 5, columns = 4, className }) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200/60 bg-white overflow-hidden", className)} role="status" aria-label="Loading">
      <div className="grid gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3" rounded="rounded-md" />
        ))}
      </div>
      <div className="px-4 sm:px-5 py-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, c) => (
              <motion.div
                key={c}
                initial={{ opacity: 0.45 }}
                animate={PULSE.animate}
                transition={{ ...PULSE.transition, delay: (r * columns + c) * 0.03 }}
                className="h-3.5 bg-slate-200/80 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Feed/list placeholder (avatar + lines per row). */
export function SkeletonList({ rows = 5, className }) {
  return (
    <div className={clsx("space-y-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-3.5">
          <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" rounded="rounded-md" />
            <Skeleton className="h-2.5 w-1/2" rounded="rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0" rounded="rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * PageSkeleton — generic page-shaped placeholder for route Suspense
 * fallbacks. No text, no spinner: header + stat cards + table.
 */
export function PageSkeleton({ cards = 4, rows = 8, columns = 5, className }) {
  return (
    <div
      className={clsx("mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8 space-y-5", className)}
      role="status"
      aria-label="Loading page"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" rounded="rounded-lg" />
          <Skeleton className="h-3.5 w-72 max-w-full" rounded="rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 shrink-0 hidden sm:block" rounded="rounded-[10px]" />
      </div>
      <SkeletonCards count={cards} />
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  );
}
