import React from "react";
import { LoginBranding, LoginForm } from "../../components/LoginPageComponents";

/**
 * LoginPage — Full-screen login page.
 *
 * Features 2 prominent ambient blue and green gradient blobs that move slowly
 * and change positions continuously across the background as an idle animation.
 */
export default function LoginPage() {
  return (
    <div
      id="login-page"
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{
        background: "linear-gradient(-45deg, #c9defa, #dce8fa, #e3f0fd, #d8f0ea, #c4e8dc, #d4e6f9)",
        backgroundSize: "400% 400%",
        animation: "subtleGradientMove 18s ease infinite",
      }}
    >
      {/* === 1. Ambient Moving Blue Gradient Blob === */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(41, 134, 232, 0.45) 0%, rgba(26, 111, 224, 0.25) 45%, transparent 70%)",
          animation: "blueBlobIdle 22s ease-in-out infinite",
        }}
      />

      {/* === 2. Ambient Moving Green Gradient Blob === */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[38rem] w-[38rem] rounded-full blur-3xl opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(39, 174, 122, 0.42) 0%, rgba(29, 170, 116, 0.22) 45%, transparent 70%)",
          animation: "greenBlobIdle 26s ease-in-out infinite",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* === Login Card === */}
      <div
        id="login-card"
        className="relative z-10 flex w-full max-w-[920px] overflow-hidden rounded-2xl bg-white"
        style={{
          minHeight: "540px",
          boxShadow: "0 25px 60px rgba(15,50,100,0.12), 0 8px 24px rgba(15,50,100,0.08), 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        {/* Left panel — branding */}
        <LoginBranding />

        {/* Right panel — form */}
        <LoginForm />
      </div>

      {/* === Background Keyframe Animations === */}
      <style>{`
        @keyframes subtleGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes blueBlobIdle {
          0% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(160px, 100px) scale(1.15); }
          50% { transform: translate(80px, 240px) scale(0.95); }
          75% { transform: translate(-70px, 130px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes greenBlobIdle {
          0% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(-170px, -120px) scale(1.12); }
          50% { transform: translate(-100px, -260px) scale(1.05); }
          75% { transform: translate(60px, -140px) scale(0.92); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </div>
  );
}
