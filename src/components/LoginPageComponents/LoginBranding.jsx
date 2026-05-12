import React from "react";
import logo from "../../assets/one-data-logo.png";

/**
 * LoginBranding — Left panel of the login card.
 * Features the OneData logo, organic SVG wave shapes with a
 * large white blob (matching the reference), animated bar chart,
 * dotted grid decoration, tagline, and carousel dots.
 */
export function LoginBranding() {
  return (
    <div
      className="login-branding relative flex flex-col justify-between overflow-hidden rounded-l-2xl text-white select-none"
      style={{ flex: "0 0 46%", minHeight: "540px" }}
    >
      {/* === Base gradient background === */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(145deg, #1e81e4 0%, #2590f0 30%, #1daa74 70%, #28b882 100%)",
        }}
      />

      {/* === Dotted grid pattern overlay === */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]">
        <defs>
          <pattern id="loginDotGrid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="white" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="50%" fill="url(#loginDotGrid)" />
      </svg>

      {/* === Organic wave shapes === */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 480 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large white blob in the center */}
        <ellipse
          cx="260" cy="250" rx="170" ry="150"
          fill="white" opacity="0.92"
          style={{ filter: "blur(1px)" }}
        />

        {/* Blue flowing curve (top-right to bottom-left) */}
        <path
          d="M480,80 C420,120 380,200 340,280 C300,360 200,420 100,500 C60,530 20,560 0,600 L0,600 L480,600 Z"
          fill="url(#blueWaveGrad)"
          opacity="0.55"
        />

        {/* Green flowing curve (center to bottom-right) */}
        <path
          d="M480,180 C440,220 400,300 360,380 C320,440 260,480 180,540 C140,560 100,580 60,600 L480,600 Z"
          fill="url(#greenWaveGrad)"
          opacity="0.65"
        />

        {/* Bright green accent curve */}
        <path
          d="M480,240 C460,280 420,340 360,400 C300,450 220,500 140,560 L140,560 C180,580 240,600 320,600 L480,600 Z"
          fill="#27c48a"
          opacity="0.5"
        />

        {/* Subtle white curve inside the blob for depth */}
        <path
          d="M120,160 C180,140 300,140 380,200 C420,230 400,300 340,340 C280,380 180,360 140,300 C100,240 80,180 120,160 Z"
          fill="white"
          opacity="0.35"
        />

        <defs>
          <linearGradient id="blueWaveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2078d4" />
            <stop offset="100%" stopColor="#1a90e8" />
          </linearGradient>
          <linearGradient id="greenWaveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1daa74" />
            <stop offset="100%" stopColor="#2ac48e" />
          </linearGradient>
        </defs>
      </svg>

      {/* === Animated floating particles === */}
      <div className="pointer-events-none absolute top-6 right-10 h-3 w-3 rounded-full bg-white/25"
        style={{ animation: "loginFloat 6s ease-in-out infinite" }}
      />
      <div className="pointer-events-none absolute top-20 right-24 h-2 w-2 rounded-full bg-white/20"
        style={{ animation: "loginFloat 8s ease-in-out infinite 1s" }}
      />
      <div className="pointer-events-none absolute top-32 left-16 h-2.5 w-2.5 rounded-full bg-white/15"
        style={{ animation: "loginFloat 7s ease-in-out infinite 2s" }}
      />

      {/* === Content layer === */}
      <div className="relative z-10 flex flex-col justify-between h-full p-8">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg shadow-black/10">
            <img src={logo} alt="OneData Logo" className="h-7 w-auto" />
          </div>
          <span className="text-[1.3rem] font-bold tracking-wide drop-shadow-md">
            OneData
          </span>
        </div>

        {/* Bar-chart illustration */}
        <div className="flex items-end justify-center gap-[5px] mt-auto mb-4">
          {[
            { h: 35, color: "#3b9fef" },
            { h: 50, color: "#2a8de0" },
            { h: 28, color: "#34d399" },
            { h: 65, color: "#2078d4" },
            { h: 42, color: "#28b882" },
            { h: 80, color: "#1a6fe0" },
            { h: 48, color: "#22c985" },
            { h: 60, color: "#2590f0" },
            { h: 38, color: "#34d399" },
            { h: 72, color: "#1e81e4" },
          ].map((bar, i) => (
            <div
              key={i}
              className="rounded-t-sm"
              style={{
                width: "11px",
                height: `${bar.h}px`,
                background: `linear-gradient(to top, ${bar.color}90, ${bar.color})`,
                animation: `loginBarGrow 0.8s ease-out ${i * 0.06}s both`,
                boxShadow: `0 0 8px ${bar.color}40`,
              }}
            />
          ))}
        </div>

        {/* Tagline + carousel dots */}
        <div>
          <p className="text-[0.82rem] leading-relaxed font-semibold drop-shadow-sm max-w-[300px]">
            A Web-Based Centralized Data Repository and Dashboard System for DepEd
            Baliwag School Division Office
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-[7px] w-5 rounded-full bg-white shadow-sm" />
            <span className="h-[7px] w-[7px] rounded-full bg-white/45" />
            <span className="h-[7px] w-[7px] rounded-full bg-white/45" />
          </div>
        </div>
      </div>

      {/* === Keyframes === */}
      <style>{`
        @keyframes loginBarGrow {
          from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          to   { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
        @keyframes loginFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-12px) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
