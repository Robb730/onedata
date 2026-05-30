import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section
      className="relative py-16"
      style={{
        /* Gradient bridge: analytics bg → dark CTA → dark footer */
        background: "linear-gradient(to bottom, #eef2f7 0%, #dde4ef 30%, #1a2236 60%, #0f172a 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
        <div
          className="relative rounded-[20px] overflow-hidden px-8 md:px-14 py-14"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #162033 40%, #0f172a 100%)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Decorative glows */}
          <div
            className="absolute top-0 right-0 w-[300px] h-[300px] opacity-[0.18] blur-[80px]"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-[250px] h-[250px] opacity-[0.12] blur-[60px]"
            style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-[500px]">
              <h3 className="text-[1.6rem] md:text-[1.8rem] font-black text-white tracking-tight leading-tight mb-3">
                Stay updated with the latest data
              </h3>
              <p className="text-[0.85rem] text-white/40 leading-relaxed">
                Get the latest education statistics and reports from DepED
                Baliwag Division. Access real-time analytics and insights.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-[12px] px-8 py-4 text-[0.88rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-[2px] shrink-0"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              View Full Report <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
