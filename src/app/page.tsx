"use client";

import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseGrid } from "@/components/home/CourseGrid";
import { EmulatorStatusCard } from "@/components/home/EmulatorStatusCard";
import { Footer } from "@/components/navigation/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-black dark:bg-black light:bg-white text-white dark:text-white light:text-black">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Featured LMS Courses & Razorpay Checkout Flow */}
        <CourseGrid />

        {/* Firebase Emulator Suite & Security Rules Verification */}
        <EmulatorStatusCard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
