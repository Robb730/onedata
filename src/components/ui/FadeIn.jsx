import { AnimatePresence, motion } from "motion/react";

/**
 * FadeSwap — crossfade between a skeleton and loaded content.
 * Skeleton exits (opacity → 0), content fades in when `loading` flips false.
 *
 * @param {boolean} loading
 * @param {ReactNode} skeleton — placeholder shown while loading
 * @param {ReactNode} children — real content
 * @param {string} [className]
 */
export function FadeSwap({ loading, skeleton, children, className }) {
  return (
    <div className={className} aria-busy={loading || undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Simple fade-in wrapper for freshly loaded content. */
export function FadeIn({ children, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay }}
    >
      {children}
    </motion.div>
  );
}
