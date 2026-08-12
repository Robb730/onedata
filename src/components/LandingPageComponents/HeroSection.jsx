import React from "react";
import { ChevronDown } from "lucide-react";
import photoBackground from "../../assets/photo-background.png";
import gradientOverlay from "../../assets/gradient-overlay.png";
import wavesOverlay from "../../assets/waves-overlay.png";
import sdoLogo from "../../assets/sdo-logo.png";

export function HeroSection() {
  const handleExploreClick = () => {
    const el = document.querySelector("#analytics") || document.querySelector("#about");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-[90vh] lg:h-screen lg:max-h-[1080px] max-w-[1920px] mx-auto hidden md:flex items-center overflow-x-clip bg-[#0c192e] select-none"
    >
      {/* ── 1. Photo Background Layer with Smooth Entrance Animation ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={photoBackground}
          alt="Baliwag Division Clock Tower Background"
          className="w-full h-full object-cover object-[center_35%] animate-bg-entrance"
        />
      </div>

      {/* ── 2. Gradient Overlay Image & Soft Brand Tint ────── */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <img
          src={gradientOverlay}
          alt="Gradient Overlay"
          className="w-full h-full object-cover opacity-85 mix-blend-normal"
        />
      </div>

      {/* Enhanced color blending matching reference image tone */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(108deg, rgba(14,30,64,0.74) 0%, rgba(18,74,132,0.50) 42%, rgba(13,148,136,0.38) 72%, rgba(16,185,129,0.35) 100%)",
        }}
      />

      {/* Soft left vignette for crisp text contrast */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(10,20,40,0.35) 0%, transparent 65%)",
        }}
      />

      {/* ── 3. Translucent Floating Circles Overlay ─────────── */}
      <div className="absolute inset-0 z-[10] pointer-events-none overflow-hidden">
        {/* Circle 1: Top Left Center (subtle purple-indigo blur) */}
        <div
          className="absolute top-[14%] left-[38%] w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-300/30 backdrop-blur-[2px] shadow-[0_0_20px_rgba(165,180,252,0.3)] animate-float-slow"
          style={{ animationDelay: "0s" }}
        />

        {/* Circle 2: Far Left Middle (solid royal blue) */}
        <div
          className="absolute top-[42%] left-[6%] w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#1d4ed8] opacity-90 shadow-[0_4px_16px_rgba(29,78,216,0.6)] animate-float-reverse"
          style={{ animationDelay: "0.5s" }}
        />

        {/* Circle 3: Lower Left (medium blue - placed to left of button) */}
        <div
          className="absolute top-[67%] left-[23%] w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#1e40af]/85 shadow-md animate-float-slow"
          style={{ animationDelay: "1.2s" }}
        />

        {/* Circle 4: Top Right (bright mint green) */}
        <div
          className="absolute top-[10%] left-[78.5%] w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#34d399]/75 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-float-reverse"
          style={{ animationDelay: "0.8s" }}
        />

        {/* Circle 5: Mid Right (small mint green) */}
        <div
          className="absolute top-[43%] left-[91.5%] w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#34d399]/75 shadow-[0_0_12px_rgba(52,211,153,0.5)] animate-float-slow"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Circle 6: Bottom Right (soft emerald circle near wave) */}
        <div
          className="absolute top-[66%] left-[64.5%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#6ee7b7]/45 backdrop-blur-[1px] shadow-[0_0_18px_rgba(110,231,183,0.4)] animate-float-reverse"
          style={{ animationDelay: "0.2s" }}
        />
      </div>

      {/* ── 4. Main Hero Content (Optimized for 1920x1080p fit) ── */}
      <div className="relative z-[20] max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full pt-16 pb-28 sm:pb-36 md:pt-20 md:pb-44 lg:pt-20 lg:pb-36">
        <div className="max-w-xl text-left">
          {/* Department Glass Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 mb-5 bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/15 animate-hero-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-white/20 shrink-0">
              <img
                src={sdoLogo}
                alt="DepEd SDO Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[0.72rem] sm:text-xs font-medium text-white/90 tracking-wide">
              Department of Education
            </span>
            <span className="text-white/40 text-[0.68rem] font-light">-</span>
            <span className="text-[0.72rem] sm:text-xs font-bold text-[#34d399] tracking-wide">
              Baliwag Division
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold text-white tracking-tight leading-[1.1] mb-4 animate-hero-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            Education Data
            <br />
            <span
              className="inline-block mt-0.5 font-extrabold"
              style={{
                background:
                  "linear-gradient(90deg, #38bdf8 0%, #2dd4bf 45%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Overview
            </span>
          </h1>

          {/* Subtitle Paragraph */}
          <p
            className="text-xs sm:text-sm md:text-[0.92rem] text-slate-100/90 font-normal leading-relaxed max-w-lg mb-6 animate-hero-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            Comprehensive education statistics and analytics dashboard for DepED
            Baliwag Division. Visualize enrollment, performance, and resource
            data across 64 schools.
          </p>

          {/* CTA Button */}
          <div
            className="animate-hero-fade-up"
            style={{ animationDelay: "0.55s" }}
          >
            <button
              onClick={handleExploreClick}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-white/10 border border-white/30 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ChevronDown
                size={15}
                className="text-white transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Bottom Waves Overlay Transition ──────────────── */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-[30] pointer-events-none select-none">
        <img
          src={wavesOverlay}
          alt="Bottom Wave Graphic Overlay"
          className="w-full h-auto object-contain object-bottom leading-none block animate-waves-entrance"
        />
      </div>

      {/* ── Embedded CSS Animations ───────────────────────── */}
      <style>{`
        @keyframes bgEntrance {
          0% {
            opacity: 0.1;
            transform: scale(1.12);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes wavesEntrance {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.04);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(8px) scale(0.96);
          }
        }

        .animate-bg-entrance {
          animation: bgEntrance 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-waves-entrance {
          animation: wavesEntrance 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }

        .animate-hero-fade-up {
          animation: heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 7s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
