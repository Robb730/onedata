import { useEffect, useRef, useCallback } from "react";

// Fires onIdle after `timeoutMs` of no user activity.
// Activity = mouse move/click, keypress, scroll, touch.
export function useIdleTimeout(onIdle, timeoutMs = 20 * 60 * 1000) {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);

  // Keep ref in sync so we always call the latest callback without re-registering events
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onIdleRef.current(), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start the timer immediately

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}
