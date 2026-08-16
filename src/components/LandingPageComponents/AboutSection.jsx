import React from "react";
import { Database, LayoutDashboard, ShieldCheck, Search } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import logo from "../../assets/one_data-icon-v3.svg";
import sdoLogo from "../../assets/sdo-logo.png";

const pillars = [
  {
    icon: Database,
    title: "Secure repository",
    desc: "Authorized personnel manage educational documents and records in an organized, access-controlled workspace.",
    accent: "#3b82f6",
  },
  {
    icon: LayoutDashboard,
    title: "Community dashboard",
    desc: "Selected statistics are published through interactive charts so the community can see how the division is doing.",
    accent: "#10b981",
  },
  {
    icon: ShieldCheck,
    title: "Trusted access",
    desc: "Only verified SDO Baliwag users can upload, request, and administer files — with a clear trail of activity.",
    accent: "#6366f1",
  },
  {
    icon: Search,
    title: "One source of truth",
    desc: "Enrollment, schools, teachers, and classrooms live together so information is easier to find, understand, and use.",
    accent: "#f59e0b",
  },
];

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-12 md:py-20 scroll-mt-20 bg-white"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="About OneData"
          title="Built for DepEd SDO Baliwag"
          subtitle="A centralized platform for educational data — simpler, faster, more secure, and more transparent."
        />

        <div className="grid lg:grid-cols-12 gap-5 md:gap-7 mb-8 md:mb-10">
          <div
            className="landing-card lg:col-span-7 rounded-[18px] md:rounded-[22px] bg-white p-5 sm:p-8 md:p-10"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                <img src={logo} alt="" className="h-7 w-7 object-contain" />
              </span>
              <div>
                <p className="text-[1.05rem] font-black text-slate-800 tracking-tight leading-none">
                  One<span className="text-emerald-500">Data</span>
                </p>
                <p className="text-[0.68rem] font-semibold text-slate-400 mt-1">
                  Schools Division Office · City of Baliwag
                </p>
              </div>
            </div>

            <p className="text-[0.88rem] md:text-[0.95rem] text-slate-600 leading-relaxed mb-4">
              ONE DATA is a centralized web-based platform built to make educational
              data management simpler, faster, more secure, and more transparent for
              the DepEd Schools Division Office of the City of Baliwag.
            </p>
            <p className="text-[0.88rem] md:text-[0.95rem] text-slate-600 leading-relaxed">
              It provides authorized personnel with a secure and organized space to
              manage educational documents and records, while giving the community
              access to selected statistics through an interactive dashboard. By
              bringing data together in one platform, ONE DATA makes information
              easier to find, understand, and use.
            </p>
          </div>

          <div
            className="landing-card-dark lg:col-span-5 relative overflow-hidden rounded-[18px] md:rounded-[22px] p-6 sm:p-8 flex flex-col justify-center min-h-[280px]"
            style={{
              background: "linear-gradient(155deg, #0c192e 0%, #132844 48%, #0f3d3a 100%)",
              boxShadow: "0 12px 40px rgba(12,25,46,0.28)",
              animationDelay: "0.08s",
            }}
          >
            <div
              className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full blur-[50px] opacity-40"
              style={{ background: "#3b82f6" }}
            />
            <div
              className="pointer-events-none absolute -bottom-12 left-0 h-36 w-36 rounded-full blur-[50px] opacity-30"
              style={{ background: "#10b981" }}
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-5">
                <img src={sdoLogo} alt="" className="h-5 w-5 rounded-full object-cover" />
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-300">
                  DepEd Baliwag
                </span>
              </div>
              <p className="text-[1.35rem] sm:text-[1.55rem] font-black text-white tracking-tight leading-snug">
                One platform.
                <br />
                One source of information.
                <br />
                <span className="about-onedata-gradient">OneData.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="landing-card group rounded-[16px] bg-white p-5"
              style={{ animationDelay: `${0.12 + i * 0.06}s` }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[12px] mb-4"
                style={{ background: `${p.accent}14` }}
              >
                <p.icon size={18} style={{ color: p.accent }} strokeWidth={2} />
              </div>
              <h3 className="text-[0.88rem] font-bold text-slate-800 mb-1.5">{p.title}</h3>
              <p className="text-[0.75rem] text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
