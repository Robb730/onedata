import React from "react";

/**
 * LoginButton — Primary submit button with gradient background,
 * hover lift effect, glow shadow, and an animated shine sweep.
 *
 * @param {object}   props
 * @param {string}   [props.label]    — button text (default "Log In")
 * @param {boolean}  [props.loading]  — show a spinner when true
 * @param {function} [props.onClick]  — click handler
 * @param {string}   [props.type]     — button type (default "submit")
 */
export function LoginButton({
  label = "Log In",
  loading = false,
  onClick,
  type = "submit",
}) {
  return (
    <>
      <button
        id="login-submit-btn"
        type={type}
        onClick={onClick}
        disabled={loading}
        className="login-btn relative w-full overflow-hidden rounded-xl py-3.5 text-[0.9rem] font-bold tracking-wide text-white
                   transition-all duration-300 cursor-pointer
                   hover:-translate-y-[1px]
                   active:translate-y-0
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #1a6fe0 0%, #2986e8 50%, #2078d4 100%)",
          boxShadow: "0 4px 18px rgba(26,111,224,0.35), 0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Shine sweep */}
        <span className="login-btn-shine pointer-events-none absolute inset-0" />

        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Signing in…
          </span>
        ) : (
          label
        )}
      </button>

      <style>{`
        .login-btn:hover {
          box-shadow: 0 6px 24px rgba(26,111,224,0.45), 0 2px 6px rgba(0,0,0,0.12) !important;
          background: linear-gradient(135deg, #1565c0 0%, #2078d4 50%, #1a6fe0 100%) !important;
        }
        .login-btn:active {
          box-shadow: 0 2px 10px rgba(26,111,224,0.3), 0 1px 2px rgba(0,0,0,0.08) !important;
        }
        .login-btn-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255,255,255,0.3) 50%,
            transparent 75%
          );
          transform: translateX(-100%);
        }
        .login-btn:hover .login-btn-shine::after {
          animation: loginShine 0.7s ease-out forwards;
        }
        @keyframes loginShine {
          to { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
