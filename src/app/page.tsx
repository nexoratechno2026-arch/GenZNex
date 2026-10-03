"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseGrid } from "@/components/home/CourseGrid";
import { EmulatorStatusCard } from "@/components/home/EmulatorStatusCard";
import { Footer } from "@/components/navigation/Footer";
import type { UserRole } from "@/types";

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("student");

  return (
    <div className="flex flex-col min-h-screen bg-grid-pattern">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection currentRole={currentRole} />

        {/* Featured LMS Courses & Razorpay Checkout Flow */}
        <CourseGrid currentRole={currentRole} />

        {/* Firebase Emulator Suite & Security Rules Verification */}
        <EmulatorStatusCard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
