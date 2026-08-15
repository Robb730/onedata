import { useEffect } from "react";
import { createPortal } from "react-dom";

let openCount = 0;

function syncBlurClass() {
  document.documentElement.classList.toggle("modal-blur-root", openCount > 0);
}

/**
 * Renders overlays on document.body and flags <html> so the app shell
 * can be filtered. CSS backdrop-filter is unreliable on Windows.
 */
export default function ModalPortal({ children }) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    openCount += 1;
    syncBlurClass();
    return () => {
      openCount = Math.max(0, openCount - 1);
      syncBlurClass();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
