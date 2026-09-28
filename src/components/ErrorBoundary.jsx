import { Component } from "react";

/**
 * ErrorBoundary — catches render/lazy-chunk failures in its subtree and
 * shows a fallback instead of a blank white page.
 *
 * Use around lazy-loaded dashboard sections (e.g. ResourcesByLevel) so a
 * stale cached chunk or bad data shape only blanks that panel, never the
 * whole app. A hard reload re-fetches index.html + fresh hashed assets.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", this.props.name || "section", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="py-10 px-4 text-center">
          <p className="text-sm font-semibold text-slate-600">
            This section failed to load.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            It may be an outdated cached version — reloading fetches the latest.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-full shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
