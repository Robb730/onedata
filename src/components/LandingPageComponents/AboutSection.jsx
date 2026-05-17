import React from "react";
import { SectionHeader } from "./SectionHeader";
import { BarChart3, Shield, Zap, Database } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Interactive dashboards with enrollment trends, dropout rates, promotion data, and cohort survival analysis across all school levels.",
    color: "#3b82f6",
  },
  {
    icon: Database,
    title: "Centralized Data Hub",
    desc: "A unified platform consolidating CESPES reports, accomplishment tracking, school performance, and QBEDP progress in one place.",
    color: "#6366f1",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    desc: "Role-based access control ensures only authorized personnel can view, edit, and manage sensitive educational data and records.",
    color: "#10b981",
  },
  {
    icon: Zap,
    title: "Actionable Insights",
    desc: "Transform raw education data into clear visual stories — helping administrators make faster, more informed policy decisions.",
    color: "#f59e0b",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeader
          label="About OneData"
          title="Built for Smarter Education Management"
          subtitle="OneData empowers the Schools Division of Baliwag with a comprehensive analytics platform designed for data-driven decision making."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-[16px] border border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:border-slate-200/80"
              style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[12px] mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${f.color}10` }}
              >
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 className="text-[0.92rem] font-bold text-slate-800 mb-2">
                {f.title}
              </h3>
              <p className="text-[0.78rem] text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
