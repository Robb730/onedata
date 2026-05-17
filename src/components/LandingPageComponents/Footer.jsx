import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import logo from "../../assets/one-data-logo.png";
import sdoLogo from "../../assets/sdo-logo.png";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Analytics", href: "#analytics" },
  { label: "Contact", href: "#contact" },
];

const resources = [
  { label: "Annual Reports", href: "#" },
  { label: "Data Portal", href: "#" },
  { label: "School Directory", href: "#" },
  { label: "Teacher Resources", href: "#" },
];

const contacts = [
  { icon: MapPin, text: "DepED Division Office, Baliwag, Bulacan" },
  { icon: Phone, text: "(044) 766-2360" },
  { icon: Mail, text: "deped.baliwag@deped.gov.ph" },
];

export function Footer() {
  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      id="contact"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #0c1322 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="OneData" className="w-7 h-7" />
              <span className="text-[1.1rem] font-bold text-white tracking-tight">
                One<span className="text-emerald-400">Data</span>
              </span>
            </div>
            <p className="text-[0.78rem] text-slate-400 leading-relaxed mb-5 max-w-[240px]">
              Comprehensive education data platform for DepED Baliwag Division,
              providing analytics and insights.
            </p>
            <div className="flex items-center gap-2.5">
              <img src={sdoLogo} alt="DepEd" className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-[0.58rem] font-bold text-slate-500 uppercase tracking-[0.1em]">
                  Powered by
                </p>
                <p className="text-[0.72rem] font-semibold text-emerald-400">
                  Department of Education
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-[0.15em] mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => handleNav(l.href)}
                    className="text-[0.8rem] text-slate-400 hover:text-blue-400 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-[0.15em] mb-5">
              Resources
            </h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {resources.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[0.8rem] text-slate-400 hover:text-blue-400 transition-colors no-underline font-medium"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-[0.15em] mb-5">
              Contact
            </h4>
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.text} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80">
                    <c.icon size={13} className="text-blue-400" />
                  </div>
                  <span className="text-[0.78rem] text-slate-400 leading-relaxed font-medium">
                    {c.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[0.68rem] text-slate-600 font-medium">
            © {new Date().getFullYear()} OneData. DepED Baliwag Division. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-[6px] w-[6px] rounded-full bg-emerald-500" />
            <span className="text-[0.65rem] text-slate-500 font-medium">
              System Online · Data Updated Feb 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
