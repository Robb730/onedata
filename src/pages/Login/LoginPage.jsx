import React from "react";
import {useState} from "react";
import { LoginBranding, LoginForm } from "../../components/LoginPageComponents";
import {supabase} from '../../lib/supabaseClient';

/**
 * LoginPage — Full-screen login page.
 *
 * Layout: a floating card split into two panels
 *  • Left  — branding, organic SVG shapes, illustrations, tagline
 *  • Right — login form
 *
 * The card sits on a rich ambient gradient background with
 * multiple layered decorative blobs and a subtle noise texture.
 */
export default function LoginPage() {

  

  return (
    <div
      id="login-page"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #c9defa 0%, #dce8fa 25%, #e3f0fd 50%, #d8f0ea 75%, #c4e8dc 100%)",
      }}
    >
      {/* === Ambient background blobs === */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(41,134,232,0.25), transparent 70%)" }}
      />
      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(39,174,122,0.2), transparent 70%)" }}
      />
      <div className="pointer-events-none absolute top-[15%] right-[20%] h-64 w-64 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(41,134,232,0.15), transparent 70%)",
          animation: "loginPagePulse 6s ease-in-out infinite",
        }}
      />
      <div className="pointer-events-none absolute bottom-[20%] left-[15%] h-48 w-48 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(39,174,122,0.12), transparent 70%)",
          animation: "loginPagePulse 8s ease-in-out infinite 2s",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
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

      {/* === Page-level keyframes === */}
      <style>{`
        @keyframes loginPagePulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
