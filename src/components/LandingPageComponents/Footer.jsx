import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, ArrowUp, ArrowRight } from "lucide-react";
import logo from "../../assets/one_data-icon-v3.svg";
import sdoLogo from "../../assets/sdo-logo.png";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Analytics", href: "#analytics" },
  { label: "Contact", href: "#contact" },
];

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
        background: "linear-gradient(180deg, #0c1222 0%, #080c16 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "linear-gradient(180deg, transparent, black 18%, black 78%, transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full blur-[90px] opacity-25"
        style={{ background: "#2563eb" }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full blur-[100px] opacity-20"
        style={{ background: "#10b981" }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 md:pt-20 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="rounded-[20px] md:rounded-[24px] border border-white/[0.07] bg-white/[0.03] p-5 sm:p-8 md:p-10 mb-6 md:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => handleNav("#home")}
                className="flex items-center gap-2.5 mb-5 bg-transparent border-none p-0 cursor-pointer"
              >
                <img
                  src={logo}
                  alt=""
                  className="w-8 h-8 object-contain shrink-0"
                />
                <span className="text-[1.2rem] font-bold text-white tracking-tight">
                  One<span className="text-emerald-400">Data</span>
                </span>
              </button>

              <p className="text-[0.84rem] text-slate-400 leading-relaxed mb-6 max-w-[340px]">
                Centralized education data for SDO Baliwag — analytics,
                repository, and institutional insights in one place.
              </p>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-3">
                <img
                  src={sdoLogo}
                  alt="SDO Baliwag"
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/15"
                />
                <div className="leading-tight">
                  <p className="text-[0.58rem] font-bold text-slate-500 uppercase tracking-[0.14em]">
                    Schools Division of
                  </p>
                  <p className="text-[0.8rem] font-bold text-white mt-0.5">
                    Baliwag, Bulacan
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-[0.68rem] font-bold text-white/50 uppercase tracking-[0.16em] mb-5">
                Explore
              </h4>
              <ul className="space-y-1 list-none p-0 m-0">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={() => handleNav(l.href)}
                      className="group flex items-center gap-2 w-full text-left text-[0.86rem] text-slate-400 hover:text-white transition-colors duration-200 bg-transparent border-none cursor-pointer py-1.5 px-0 font-medium"
                    >
                      <span className="h-px w-0 bg-emerald-400 group-hover:w-3 transition-all duration-200" />
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h4 className="text-[0.68rem] font-bold text-white/50 uppercase tracking-[0.16em] mb-5">
                Contact
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/15">
                    <MapPin size={15} className="text-blue-400" />
                  </span>
                  <p className="text-[0.82rem] text-slate-400 leading-relaxed font-medium pt-1.5 m-0">
                    DepEd Division Office
                    <br />
                    Baliwag, Bulacan
                  </p>
                </div>
                <a
                  href="tel:+63447662360"
                  className="flex items-start gap-3 no-underline group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/15">
                    <Phone size={15} className="text-emerald-400" />
                  </span>
                  <span className="text-[0.82rem] text-slate-400 group-hover:text-white transition-colors font-medium pt-2">
                    (044) 762 2793
                  </span>
                </a>
                <a
                  href="mailto:deped.baliwag@deped.gov.ph"
                  className="flex items-start gap-3 no-underline group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-400/15">
                    <Mail size={15} className="text-indigo-300" />
                  </span>
                  <span className="text-[0.82rem] text-slate-400 group-hover:text-white transition-colors font-medium pt-2 break-all">
                    deped.baliwag@deped.gov.ph
                  </span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-[0.68rem] font-bold text-white/50 uppercase tracking-[0.16em] mb-5">
                Portal
              </h4>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed mb-4 m-0">
                Authorized personnel can sign in to the admin panel.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-[0.78rem] font-bold no-underline hover:bg-emerald-400 transition-colors"
              >
                Log in <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <p className="text-[0.72rem] text-slate-500 font-medium m-0 text-center sm:text-left">
            © {new Date().getFullYear()} OneData · DepEd Baliwag Division
          </p>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 text-[0.72rem] text-slate-500 font-medium">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.85)" }}
              />
              System online
            </span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.72rem] font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            >
              Back to top
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
