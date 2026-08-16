import React from "react";
import { Phone, Mail } from "lucide-react";
import sdoLogo from "../../assets/sdo-logo.png";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative bg-white py-10 md:py-14 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="landing-card-dark relative overflow-hidden rounded-[18px] md:rounded-[22px] px-5 py-6 sm:px-8 sm:py-7 md:px-10 md:py-8"
          style={{
            background: "linear-gradient(155deg, #0c192e 0%, #132844 55%, #0f172a 100%)",
            boxShadow: "0 12px 40px rgba(12,25,46,0.22)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full blur-[50px] opacity-30"
            style={{ background: "#4B86EC" }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full blur-[50px] opacity-20"
            style={{ background: "#3EBA8F" }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-3">
                <img src={sdoLogo} alt="" className="h-5 w-5 rounded-full object-cover" />
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-300">
                  DepEd Baliwag
                </span>
              </div>
              <h2 className="text-[1.2rem] md:text-[1.4rem] font-black text-white tracking-tight m-0">
                Contact info
              </h2>
              <p className="text-[0.78rem] text-slate-400 mt-1.5 mb-0 max-w-sm leading-relaxed">
                Reach the Schools Division Office of the City of Baliwag.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-0 sm:min-w-[280px]">
              <a
                href="tel:+63447622793"
                className="group flex items-center gap-3 no-underline"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <Phone size={16} className="text-white" strokeWidth={1.75} />
                </span>
                <span className="text-[0.92rem] font-medium text-slate-200 group-hover:text-white transition-colors">
                  (044) 762 2793
                </span>
              </a>
              <a
                href="mailto:baliwag.city@deped.gov.ph"
                className="group flex items-center gap-3 no-underline min-w-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <Mail size={16} className="text-white" strokeWidth={1.75} />
                </span>
                <span className="text-[0.88rem] sm:text-[0.92rem] font-medium text-[#4B86EC] group-hover:text-[#7aa8f5] transition-colors break-all">
                  baliwag.city@deped.gov.ph
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
