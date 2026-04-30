import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "../../assets/one-data-logo.png";

const navItems = ["Home", "Divisions", "About", "Contact"];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.04)" : "none",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease, background-color 0.5s, box-shadow 0.5s, border-color 0.5s",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[68px]">

        
        <div className="flex items-center gap-0"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logo} alt="OneData Logo" className="w-8 h-8 object-contain" />
          </div>
          <span
            className="tracking-tight"
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: scrolled ? "#1a1a2e" : "#ffffff",
              transition: "color 0.5s",
            }}
          >
            One<span style={{ color: "#3FB990" }}>Data</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item, i) => (
            <button
              key={item}
              className="px-4 py-2 rounded-lg text-[0.8125rem] font-medium bg-transparent border-none cursor-pointer transition-all duration-300"
              style={{
                color: scrolled ? "#64748b" : "rgba(255,255,255,0.7)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(-8px)",
                transition: `opacity 0.5s ease ${0.2 + i * 0.07}s, transform 0.5s ease ${0.2 + i * 0.07}s, color 0.3s, background-color 0.3s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = scrolled ? "#4B86EC" : "#ffffff";
                e.currentTarget.style.backgroundColor = scrolled ? "rgba(75,134,236,0.06)" : "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = scrolled ? "#64748b" : "rgba(255,255,255,0.7)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-lg p-2 transition-colors"
          style={{ color: scrolled ? "#1a1a2e" : "#ffffff" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100/50 px-6 py-5 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item}
              className="text-gray-600 hover:text-[#4B86EC] hover:bg-[#4B86EC]/5 py-3 px-4 rounded-xl text-[0.9375rem] font-medium text-left bg-transparent border-none cursor-pointer transition-all duration-200"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}