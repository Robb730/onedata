import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// The dashboard scrolls inside `.app-main` on large screens, but the window
// itself is the scroller below the `lg` breakpoint. Detect which one is live
// so the anchor is restored to the right element.
function getScrollContainer() {
  const el = document.querySelector(".app-main");
  if (el && el.scrollHeight > el.clientHeight + 1) return el;
  return document.scrollingElement || document.documentElement;
}

// Keeps the viewport anchored to a specific element across a re-render that
// changes the height of the content around it. Without this, a content swap
// can shift the page under the user (the browser's own scroll anchoring is
// disabled in src/index.css).
export function useScrollAnchor() {
  const pendingRef = useRef(null);
  const timerRef = useRef(null);

  // Call `applyChange` while holding the current scroll position steady.
  // `element` is the control the user interacted with — it stays mounted
  // across the change, so it can be used as the anchor point.
  const anchor = useCallback((element, applyChange) => {
    const container = getScrollContainer();
    const scrollTop = container.scrollTop;
    pendingRef.current = {
      element,
      prevTop: element ? element.getBoundingClientRect().top : null,
      prevScroll: scrollTop,
      applied: scrollTop,
    };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pendingRef.current = null;
    }, 600);

    applyChange();
  }, []);

  // Runs after every commit so the anchor is re-applied whenever the new
  // content lands, not just on the first render after the change.
  useLayoutEffect(() => {
    const p = pendingRef.current;
    if (!p) return;

    const container = getScrollContainer();

    // The content collapsed and the browser clamped the scroll to the top —
    // that is the failure this hook exists to undo.
    const collapsed = container.scrollTop === 0 && p.prevScroll > 0;

    // The user scrolled while the change was in flight — leave them alone.
    if (!collapsed && Math.abs(container.scrollTop - p.applied) > 1) {
      pendingRef.current = null;
      return;
    }

    let next = p.prevScroll;
    if (p.element && p.prevTop != null && p.element.isConnected) {
      const nowTop = p.element.getBoundingClientRect().top;
      next = p.prevScroll + (nowTop - p.prevTop);
    }

    container.scrollTop = next;
    p.applied = next;
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return anchor;
}
