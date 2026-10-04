"use client";

import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseGrid } from "@/components/home/CourseGrid";
import { Footer } from "@/components/navigation/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <HeroSection />

        {/* Featured Courses */}
        <CourseGrid />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
