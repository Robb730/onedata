import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import logo from "../../assets/one_data-icon-v3.svg";

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
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const solid = scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${solid
        ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/40 shadow-[0_1px_12px_rgba(15,23,42,0.06)]"
        : "bg-white/10 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b border-white/15 md:border-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between h-[64px]">
        <button
          onClick={() => handleNav("#home")}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
        >
          <div className="w-9 h-9 flex items-center justify-center">
            <img src={logo} alt="OneData Logo" className="w-7 h-7 object-contain" />
          </div>
          <span
            className={`text-[1.15rem] font-bold tracking-tight transition-colors duration-300 ${solid ? "text-slate-900" : "text-white"
              }`}
          >
            One<span className="text-emerald-400">Data</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.href)}
              className={`px-4 py-2 rounded-lg text-[0.8rem] font-medium bg-transparent border-none cursor-pointer transition-all duration-200 ${solid
                ? "text-slate-500 hover:text-blue-500 hover:bg-blue-50/70"
                : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
            >
              {item.label}
            </button>
          ))}

          <Link
            to="/login"
            className={`hover-flare ml-3 inline-flex items-center gap-1.5 rounded-[10px] px-5 py-[7px] text-[0.8rem] font-semibold transition-all duration-300 no-underline ${solid
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]"
              : "bg-white/12 text-white border border-white/20"
              }`}
          >
            Log in <ArrowRight size={14} />
          </Link>
        </div>

        <button
          className={`md:hidden rounded-lg p-2 bg-transparent border-none cursor-pointer transition-transform duration-300 ${solid ? "text-slate-900" : "text-white"
            } ${mobileOpen ? "rotate-90" : "rotate-0"}`}
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`md:hidden grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-5 py-3 flex flex-col gap-1 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${solid
              ? "bg-white/70 border-t border-slate-200/40"
              : "bg-white/10 border-t border-white/15"
              } ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item.href)}
                className={`py-3 px-4 rounded-xl text-[0.9rem] font-medium text-left bg-transparent border-none cursor-pointer transition-all ${solid
                  ? "text-slate-600 hover:text-blue-500 hover:bg-white/50"
                  : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/login"
              className="hover-flare mt-2 mb-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-[0.85rem] font-semibold text-white no-underline"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
            >
              Log in <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
