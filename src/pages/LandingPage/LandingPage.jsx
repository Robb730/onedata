import React from "react";
import {Navbar} from "../../components/LandingPageComponents/Navbar";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
     {/* <HeroSection />
      <StatsCards /> */}

      {/* Section divider with decoration */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-20 mb-4">
        <div className="flex items-center gap-4">
          <div
            className="h-px flex-1"
            style={{ background: "linear-gradient(90deg, transparent, rgba(75,134,236,0.15), transparent)" }}
          />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4B86EC]" />
            <span
              className="text-gray-300"
              style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Dashboard Overview
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3FB990]" />
          </div>
          <div
            className="h-px flex-1"
            style={{ background: "linear-gradient(90deg, transparent, rgba(63,185,144,0.15), transparent)" }}
          />
        </div>
      </div>

      {/* <DemographicCharts />
      <EducationLevel />
      <Footer /> */}
    </div>
  );
}