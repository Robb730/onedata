import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import logo from "../../assets/one_data-icon-v3.svg";
import sdoLogo from "../../assets/sdo-logo.png";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Analytics", href: "#analytics" },
  { label: "Contact", href: "#contact" },
];

const contacts = [
  { icon: MapPin, text: "DepED Division Office, Baliwag, Bulacan" },
  { icon: Phone, text: "(044) 766-2360" },
  { icon: Mail, text: "deped.baliwag@deped.gov.ph" },
];

export function Footer() {
  const handleNav = (href) => {
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      id="contact"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #0b111f 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8 md:pb-10">

        {/* Top grid — 3 columns: Brand, Quick Links, Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-14">

          {/* Brand column */}
          <div className="md:col-span-1">
            {/* Logo + Wordmark */}
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="OneData Logo" className="w-8 h-8 object-contain" />
              <span className="text-[1.15rem] font-bold text-white tracking-tight">
                One<span className="text-emerald-400">Data</span>
              </span>
            </div>

            <p className="text-[0.78rem] text-slate-400 leading-[1.75] mb-6 max-w-[260px]">
              A comprehensive education data platform built for SDO Baliwag,
              providing unified analytics and institutional insights.
            </p>

            {/* DepEd badge */}
            <div className="inline-flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5">
              <img src={sdoLogo} alt="DepEd" className="w-7 h-7 rounded-full object-cover shrink-0" />
              <div className="leading-tight">
                <p className="text-[0.58rem] font-bold text-slate-500 uppercase tracking-[0.12em]">
                  Powered by
                </p>
                <p className="text-[0.72rem] font-bold text-emerald-400 mt-0.5">
                  Department of Education
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[0.62rem] font-bold text-slate-500 uppercase tracking-[0.18em] mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3.5 list-none p-0 m-0">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => handleNav(l.href)}
                    className="group flex items-center gap-2 text-[0.82rem] text-slate-400 hover:text-blue-400 transition-all duration-200 bg-transparent border-none cursor-pointer p-0 font-medium"
                  >
                    <span className="h-px w-3 bg-slate-600 group-hover:bg-blue-400 group-hover:w-4 transition-all duration-200" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[0.62rem] font-bold text-slate-500 uppercase tracking-[0.18em] mb-6">
              Contact
            </h4>
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.text} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700/60 mt-0.5">
                    <c.icon size={13} className="text-blue-400" />
                  </div>
                  <span className="text-[0.78rem] text-slate-400 leading-[1.65] font-medium">
                    {c.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-7" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[0.7rem] text-slate-600 font-medium">
            © {new Date().getFullYear()} OneData · DepED Baliwag Division · All rights reserved.
          </p>
          <div className="flex items-center gap-2.5">
            <span
              className="h-[7px] w-[7px] rounded-full bg-emerald-500"
              style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
            />
            <span className="text-[0.68rem] text-slate-500 font-medium">
              System Online · Data Updated Feb 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
