import React from "react";
import { Link } from "react-router-dom";
import { Building2, PhoneCall, AtSign, ArrowRight } from "lucide-react";
import logo from "../../assets/one_data-icon-v3.svg";
import sdoLogo from "../../assets/sdo-logo.png";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Analytics", href: "#analytics" },
  { label: "Contact", href: "#contact" },
];

const contactDetails = [
  {
    icon: Building2,
    color: "text-blue-400",
    label: "Address",
    content: (
      <>
        DepEd Division Office
        <br />
        Baliwag, Bulacan
      </>
    ),
    href: null,
  },
  {
    icon: PhoneCall,
    color: "text-emerald-400",
    label: "Phone",
    content: "(044) 762 2793",
    href: "tel:+63447662360",
  },
  {
    icon: AtSign,
    color: "text-sky-400",
    label: "Email",
    content: "deped.baliwag@deped.gov.ph",
    href: "mailto:deped.baliwag@deped.gov.ph",
  },
  {
    icon: FacebookIcon,
    color: "text-blue-400",
    label: "Facebook",
    content: "DepEd City of Baliwag",
    href: "https://www.facebook.com/SDOCityofBaliwag",
  },
];
// Inline Facebook icon since lucide-react doesn't ship one
function FacebookIcon({ size = 13, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <h4 className="flex items-center gap-2 text-[0.82rem] font-semibold text-slate-300 mb-5">
      <span
        className="h-3 w-[3px] rounded-full shrink-0"
        style={{
          background: "linear-gradient(180deg, #3b82f6 0%, #34d399 100%)",
        }}
      />
      {children}
    </h4>
  );
}

export function Footer() {
  const handleNav = (href) => {
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(155deg, #0b1638 0%, #0d2b4a 25%, #0a3b3a 55%, #072e2b 75%, #0b1638 100%)",
        backgroundSize: "300% 300%",
        animation: "footerBg 18s ease-in-out infinite",
      }}
    >
      {/* ── Scoped keyframe animations for background elements ── */}
      <style>{`
        @keyframes footerBg {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes footerOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(18px, -22px) scale(1.08); }
        }
        @keyframes footerOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-14px, 20px) scale(1.06); }
        }
        @keyframes footerDot1 {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          50%       { transform: translateY(-8px); opacity: 0.8; }
        }
        @keyframes footerDot2 {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50%       { transform: translateY(6px); opacity: 0.3; }
        }
        @keyframes footerDot3 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50%       { transform: translateY(-10px) scale(1.2); opacity: 0.65; }
        }
        @keyframes footerSeal {
          0%, 100% { opacity: 0.07; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.10; transform: scale(1.03) rotate(1.5deg); }
        }
      `}</style>

      {/* Wave seam */}
      <svg
        className="absolute top-0 left-0 w-full h-14 md:h-20"
        viewBox="0 0 1920 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,70 C420,10 760,110 1180,55 C1500,15 1750,75 1920,40 L1920,0 L0,0 Z"
          fill="url(#footerWaveGradient)"
        />
        <defs>
          <linearGradient id="footerWaveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#0ea5a0" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating accent dots — each on its own timing so they never sync */}
      <span
        className="pointer-events-none absolute left-[8%] top-24 h-3 w-3 rounded-full bg-blue-400 blur-[1px]"
        style={{ animation: "footerDot1 4.5s ease-in-out infinite" }}
      />
      <span
        className="pointer-events-none absolute right-[14%] top-16 h-2 w-2 rounded-full bg-emerald-400 blur-[1px]"
        style={{ animation: "footerDot2 3.8s ease-in-out infinite 0.9s" }}
      />
      <span
        className="pointer-events-none absolute right-[6%] bottom-20 h-4 w-4 rounded-full bg-emerald-300 blur-[2px]"
        style={{ animation: "footerDot3 5.2s ease-in-out infinite 1.7s" }}
      />

      {/* Ghosted division seal — breathes subtly */}
      <img
        src={sdoLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-20 -bottom-28 w-[380px] h-[380px] object-contain"
        style={{ animation: "footerSeal 9s ease-in-out infinite" }}
      />

      {/* Large glow orbs — drift slowly on independent paths */}
      <div
        className="pointer-events-none absolute -left-24 -top-10 h-72 w-72 rounded-full blur-[110px] opacity-[0.16]"
        style={{
          background: "#2563eb",
          animation: "footerOrb1 11s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full blur-[120px] opacity-[0.16]"
        style={{
          background: "#10b981",
          animation: "footerOrb2 13s ease-in-out infinite 2s",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-[calc(2rem+env(safe-area-inset-bottom))]">

        {/* ── Identity block ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 mb-8 border-b border-white/[0.08] lg:hidden">
          <button
            type="button"
            onClick={() => handleNav("#home")}
            className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer"
          >
            <img src={logo} alt="" className="w-8 h-8 object-contain shrink-0" />
            <span className="text-[1.15rem] font-bold text-white tracking-tight">
              One<span className="text-emerald-400">Data</span>
            </span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm pl-2 pr-3.5 py-1.5">
            <img src={sdoLogo} alt="SDO Baliwag" className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
            <span className="text-[0.75rem] font-medium text-slate-300">Schools Division of <span className="font-bold text-emerald-400">Baliwag, Bulacan</span></span>
          </div>
        </div>

        {/* ── Desktop identity block (hidden on mobile) ── */}
        <div className="hidden lg:grid grid-cols-12 gap-12 pb-14">
          <div className="col-span-5 pr-10 border-r border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleNav("#home")}
              className="flex items-center gap-2.5 mb-5 bg-transparent border-none p-0 cursor-pointer"
            >
              <img src={logo} alt="" className="w-8 h-8 object-contain shrink-0" />
              <span className="text-[1.2rem] font-bold text-white tracking-tight">
                One<span className="text-emerald-400">Data</span>
              </span>
            </button>
            <p className="text-[0.84rem] text-slate-300/80 leading-relaxed mb-6 max-w-[340px]">
              Centralized education data for SDO Baliwag — analytics, repository, and institutional insights in one place.
            </p>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm pl-2 pr-4 py-2">
              <img src={sdoLogo} alt="SDO Baliwag" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
              <span className="text-[0.8rem] font-medium text-slate-200">Schools Division of</span>
              <span className="text-[0.8rem] font-bold text-emerald-400">Baliwag, Bulacan</span>
            </div>
          </div>

          <div className="col-span-7 grid grid-cols-3 gap-10 pl-2">
            <div>
              <SectionLabel>Explore</SectionLabel>
              <ul className="space-y-1 list-none p-0 m-0">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <button type="button" onClick={() => handleNav(l.href)}
                      className="group flex items-center gap-2 w-full text-left text-[0.86rem] text-slate-300/85 hover:text-white transition-colors duration-200 bg-transparent border-none cursor-pointer py-1.5 px-0 font-medium">
                      <span className="h-px w-0 bg-emerald-400 group-hover:w-3 transition-all duration-200" />
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionLabel>Contact</SectionLabel>
              <div className="space-y-2.5">
                {contactDetails.map(({ icon: Icon, color, label, content, href }) =>
                  href ? (
                    <a key={href} href={href} className="flex items-center gap-3 no-underline group">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
                        <Icon size={13} className={color} strokeWidth={1.75} />
                      </span>
                      <span className="text-[0.82rem] text-slate-300/85 group-hover:text-white transition-colors font-medium whitespace-nowrap">{content}</span>
                    </a>
                  ) : (
                    <div key="address" className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 mt-0.5">
                        <Icon size={13} className={color} strokeWidth={1.75} />
                      </span>
                      <p className="text-[0.82rem] text-slate-300/85 font-medium m-0 leading-snug">{content}</p>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <SectionLabel>Portal</SectionLabel>
              <p className="text-[0.8rem] text-slate-400 leading-relaxed mb-4 m-0">Authorized personnel can sign in to the admin panel.</p>
              <Link to="/login" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-sm px-4 py-1.5 text-[0.78rem] font-medium text-white/90 no-underline hover:bg-white/[0.14] hover:text-white transition-colors">
                Log in <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile directory: 2-col grid ── */}
        <div className="lg:hidden grid grid-cols-2 gap-8 pb-8">
          <div>
            <SectionLabel>Explore</SectionLabel>
            <ul className="space-y-0.5 list-none p-0 m-0">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <button type="button" onClick={() => handleNav(l.href)}
                    className="group flex items-center gap-2 w-full text-left text-[0.84rem] text-slate-300/85 hover:text-white transition-colors bg-transparent border-none cursor-pointer py-2 px-0 font-medium">
                    <span className="h-px w-0 bg-emerald-400 group-hover:w-2.5 transition-all duration-200 shrink-0" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionLabel>Portal</SectionLabel>
            <p className="text-[0.78rem] text-slate-400 leading-relaxed mb-4 m-0">
              Authorized personnel sign in here.
            </p>
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-sm px-3.5 py-1.5 text-[0.76rem] font-medium text-white/90 no-underline hover:bg-white/[0.14] hover:text-white transition-colors">
              Log in <ArrowRight size={12} />
            </Link>
          </div>

          <div className="col-span-2">
            <SectionLabel>Contact</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {contactDetails.map(({ icon: Icon, color, label, content, href }) =>
                href ? (
                  <a key={href} href={href} className="flex items-center gap-2.5 no-underline group">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
                      <Icon size={13} className={color} strokeWidth={1.75} />
                    </span>
                    <span className="text-[0.8rem] text-slate-300/85 group-hover:text-white transition-colors font-medium">{content}</span>
                  </a>
                ) : (
                  <div key="address" className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 mt-0.5">
                      <Icon size={13} className={color} strokeWidth={1.75} />
                    </span>
                    <p className="text-[0.8rem] text-slate-300/85 font-medium m-0 leading-snug">{content}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/[0.08] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[0.7rem] text-slate-500 font-medium m-0 text-center sm:text-left">
            © {new Date().getFullYear()} OneData · DepEd Baliwag Division
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-slate-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.85)" }} />
            System online
          </span>
        </div>
      </div>
    </footer>
  );
}