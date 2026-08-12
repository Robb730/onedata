import { ChevronDown } from "lucide-react";
import sdoLogo from "../../assets/sdo-logo.png";

/**
 * Compact landing intro shown only on mobile, replacing the full photo hero.
 */
export function MobileIntro() {
  const handleExploreClick = () => {
    const el = document.querySelector("#analytics") || document.querySelector("#about");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="md:hidden relative overflow-hidden pt-24 pb-8 px-5"
      style={{
        background:
          "linear-gradient(165deg, #0f172a 0%, #1e3a5f 48%, #0f766e 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
      />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 bg-white/10 border border-white/20">
          <img src={sdoLogo} alt="DepEd SDO Logo" className="w-4 h-4 rounded-full object-cover" />
          <span className="text-[0.68rem] font-medium text-white/90">DepEd Baliwag Division</span>
        </div>

        <h1 className="text-[1.85rem] font-extrabold text-white tracking-tight leading-[1.15] mb-2">
          Education Data{" "}
          <span
            className="block"
            style={{
              background: "linear-gradient(90deg, #38bdf8 0%, #2dd4bf 50%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Overview
          </span>
        </h1>

        <p className="text-[0.82rem] text-slate-200/80 leading-relaxed mb-5 max-w-[34ch]">
          Enrollment, performance, and resource analytics across 64 schools.
        </p>

        <button
          type="button"
          onClick={handleExploreClick}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[0.8rem] font-medium text-white bg-white/10 border border-white/25"
        >
          Explore <ChevronDown size={14} />
        </button>
      </div>
    </section>
  );
}
