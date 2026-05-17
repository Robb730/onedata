import React from "react";
import {
  Navbar,
  HeroSection,
  HeroStats,
  AnalyticsPreview,
  Footer,
} from "../../components/LandingPageComponents";

/**
 * LandingPage — Public-facing homepage for the OneData platform.
 *
 * Page composition only — all content lives in reusable components
 * inside components/LandingPageComponents/.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HeroStats />
      <AnalyticsPreview />
      <Footer />
    </div>
  );
}