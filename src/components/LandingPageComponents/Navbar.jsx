import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import logo from "../../assets/one-data-logo.png";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Analytics", href: "#analytics" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(1.6)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(203,213,225,0.3)"
          : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 12px rgba(15,23,42,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[64px]">
        {/* Logo */}
        <button
          onClick={() => handleNav("#home")}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
        >
          <div className="w-9 h-9 flex items-center justify-center">
            <img src={logo} alt="OneData Logo" className="w-7 h-7 object-contain" />
          </div>
          <span
            className="text-[1.15rem] font-bold tracking-tight transition-colors duration-300"
            style={{ color: scrolled ? "#0f172a" : "#ffffff" }}
          >
            One<span className="text-emerald-400">Data</span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.href)}
              className="px-4 py-2 rounded-lg text-[0.8rem] font-medium bg-transparent border-none cursor-pointer transition-all duration-200"
              style={{
                color: scrolled ? "#475569" : "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = scrolled ? "#3b82f6" : "#fff";
                e.currentTarget.style.backgroundColor = scrolled
                  ? "rgba(59,130,246,0.06)"
                  : "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = scrolled
                  ? "#475569"
                  : "rgba(255,255,255,0.75)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {item.label}
            </button>
          ))}

          {/* Login CTA */}
          <Link
            to="/login"
            className="ml-3 inline-flex items-center gap-1.5 rounded-[10px] px-5 py-[7px] text-[0.8rem] font-semibold transition-all duration-300 no-underline"
            style={{
              background: scrolled
                ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                : "rgba(255,255,255,0.12)",
              color: "#fff",
              border: scrolled ? "none" : "1px solid rgba(255,255,255,0.2)",
              boxShadow: scrolled ? "0 2px 10px rgba(99,102,241,0.3)" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = scrolled
                ? "0 4px 16px rgba(99,102,241,0.4)"
                : "0 2px 12px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = scrolled
                ? "0 2px 10px rgba(99,102,241,0.3)"
                : "none";
            }}
          >
            Log in <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-lg p-2 bg-transparent border-none cursor-pointer"
          style={{ color: scrolled ? "#0f172a" : "#fff" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100/50 px-6 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.href)}
              className="text-slate-600 hover:text-blue-500 hover:bg-blue-50/50 py-3 px-4 rounded-xl text-[0.9rem] font-medium text-left bg-transparent border-none cursor-pointer transition-all"
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/login"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-[0.85rem] font-semibold text-white no-underline"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
          >
            Log in <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </nav>
  );
}