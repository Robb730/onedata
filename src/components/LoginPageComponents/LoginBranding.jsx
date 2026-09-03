import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/one-data-logo.png";
import loginImage from "../../assets/login-image.png";

/**
 * LoginBranding — Left panel of the login card.
 * Uses login-image.png on the left panel with the OneData logo
 * positioned lower at top center, "#282828" "OneData" text below logo,
 * and white text for the tagline at the bottom.
 */
export function LoginBranding() {
  const navigate = useNavigate();

  return (
    <div
      className="login-branding relative hidden md:flex flex-col items-center justify-between overflow-hidden rounded-l-2xl select-none"
      style={{ flex: "0 0 46%", minHeight: "540px" }}
    >
      {/* Background Image */}
      <img
        src={loginImage}
        alt="Login Illustration"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Back to Home — icon only, glass circle */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Back to Home"
      >
        <ArrowLeft size={16} strokeWidth={2.2} />
      </button>
      {/* Top Center: Logo + "OneData" Text */}
      <div className="relative z-10 flex flex-col items-center pt-14 px-6 text-center w-full">
        <img
          src={logo}
          alt="OneData Logo"
          className="h-16 w-auto transition-transform duration-300 hover:scale-105"
        />
        <h2
          className="mt-2 text-2xl font-extrabold tracking-wider"
          style={{ color: "#282828" }}
        >
          OneData
        </h2>
      </div>

      {/* Bottom Tagline */}
      <div className="relative z-10 pb-8 px-6 text-center">
        <p className="text-xs font-medium text-white drop-shadow-sm max-w-[280px]">
          Centralized Data Repository & Dashboard System
        </p>
      </div>
    </div>
  );
}
