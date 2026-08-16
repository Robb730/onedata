import React, { useState, useEffect } from "react";
import {
  Navbar,
  HeroSection,
  MobileIntro,
  HeroStats,
  AboutSection,
  ContactSection,
  Footer,
} from "../../components/LandingPageComponents";
import { getAllSchoolYearsForSelector } from "../../utils/schoolYearsApi"; // adjust path as needed

export default function LandingPage() {
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearsLoading, setYearsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadYears() {
      try {
        const years = await getAllSchoolYearsForSelector(); // [{ year, status, archived }, ...]
        if (cancelled) return;

        setAvailableYears(years);

        if (years.length > 0) {
          // Default to the latest archived year (years are already
          // sorted with active first, then archived newest → oldest,
          // so the first archived entry is the latest one).
          const latestArchived = years.find((y) => y.status === "archived");
          setSelectedYear((latestArchived ?? years[0]).year);
        }
      } catch (err) {
        console.error("Error loading school years:", err);
      } finally {
        if (!cancelled) setYearsLoading(false);
      }
    }

    loadYears();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <MobileIntro />
      <HeroSection />
      <AboutSection />
      {!yearsLoading && selectedYear && (
        <HeroStats
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
        />
      )}
      <ContactSection />
      <Footer />
    </div>
  );
}