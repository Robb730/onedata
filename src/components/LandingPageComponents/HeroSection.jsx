import React from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroImg from "../../assets/hero-image-1.png";
import sdoLogo from "../../assets/sdo-logo.png";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-[100vh] flex items-center overflow-hidden"
    >
      {/* ── Background image layer ─────────────────── */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Baliwag Flagship Program"
          className="w-full h-full object-cover"
          style={{
            objectPosition: "center 35%",
            filter: "brightness(0.82) saturate(1.3)",
          }}
        />
      </div>

      {/* ── Overlay stack for depth & brand integration ── */}
      {/* Primary dark navy overlay — brand color foundation */}
      {/* Primary overlay — lighter, lets artwork breathe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(10,15,30,0.55) 0%, rgba(15,23,42,0.35) 35%, rgba(15,23,42,0.25) 60%, rgba(10,15,30,0.4) 100%)",
        }}
      />
      {/* Left-side text readability zone — keeps text area darker */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,15,30,0.65) 0%, rgba(10,15,30,0.4) 35%, transparent 55%)",
        }}
      />
      {/* Bottom fade — seamless transition into stats section */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 55%, rgba(10,15,30,0.7) 80%, rgba(10,15,30,0.95) 95%, #0a0f1e 100%)",
        }}
      />
      {/* Blue brand tint — blends image into OneData palette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, transparent 40%, rgba(99,102,241,0.08) 100%)",
          mixBlendMode: "normal",
        }}
      />
      {/* Vignette — soft cinematic edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(10,15,30,0.25) 100%)",
        }}
      />

      {/* ── Ambient glow accents ───────────────────── */}
      <div
        className="absolute top-[10%] right-[8%] w-[450px] h-[450px] rounded-full opacity-[0.15] blur-[100px]"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          animation: "heroGlow 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[25%] left-[3%] w-[350px] h-[350px] rounded-full opacity-[0.1] blur-[90px]"
        style={{
          background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
          animation: "heroGlow 13s ease-in-out infinite reverse",
        }}
      />

      {/* ── Grid pattern — subtle texture ─────────── */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* ── Content ────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-[130px] pb-[120px]">
        <div className="max-w-[640px]">
          {/* Department badge */}
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-4 py-[6px] mb-8"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <img src={sdoLogo} alt="DepEd" className="w-[18px] h-[18px] rounded-full" />
            <span className="text-[0.65rem] font-semibold text-white/55 tracking-[0.03em]">
              Department of Education
            </span>
            <span className="text-white/15">·</span>
            <span className="text-[0.65rem] font-semibold text-emerald-400/80 tracking-[0.03em]">
              Baliwag Division
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[3rem] md:text-[3.6rem] font-black text-white leading-[1.06] tracking-tight mb-6">
            Education Data
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 40%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Overview
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-[0.95rem] text-white/40 leading-[1.7] max-w-[480px] mb-9">
            Comprehensive education statistics and analytics dashboard for
            DepED Baliwag Division. Visualize enrollment, performance, and
            resource data across 64 schools.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 rounded-[12px] px-7 py-3.5 text-[0.85rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-[2px]"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                boxShadow:
                  "0 4px 20px rgba(99,102,241,0.3), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Explore Dashboard <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => {
                const el = document.querySelector("#analytics");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-[12px] px-7 py-3.5 text-[0.85rem] font-semibold text-white/65 bg-transparent cursor-pointer transition-all duration-300 hover:-translate-y-[1px] hover:text-white/90"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
              }}
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ──────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <span className="text-[0.55rem] text-white/30 uppercase tracking-[0.2em] font-semibold">
          Scroll to explore
        </span>
        <ChevronDown size={16} className="text-white/25 animate-bounce" />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes heroGlow {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-20px) scale(1.03); opacity: 0.2; }
        }
      `}</style>
    </section>
  );
}
