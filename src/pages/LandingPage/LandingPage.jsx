import React, { useState } from "react";
import {
  Navbar,
  HeroSection,
  MobileIntro,
  HeroStats,
  AnalyticsPreview,
  Footer,
} from "../../components/LandingPageComponents";

const AVAILABLE_YEARS = ["2026-2027", "2025-2026", "2024-2025", "2023-2024", "2022-2023"];

export default function LandingPage() {
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[1]); // default: 2025-2026, the one with data

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <MobileIntro />
      <HeroSection />
      <HeroStats
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={AVAILABLE_YEARS}
      />
      {/* <AnalyticsPreview /> */} 
      <Footer />
    </div>
  );
}
