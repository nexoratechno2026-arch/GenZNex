"use client";

import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

export function HeroSection() {
  const pillars = [
    {
      iconName: "code",
      title: "Project-First",
      subtitle: "Hands-on production code",
    },
    {
      iconName: "translate",
      title: "Bilingual",
      subtitle: "Tamil & English instruction",
    },
    {
      iconName: "support_agent",
      title: "Direct Mentorship",
      subtitle: "Live cohort doubt solving",
    },
    {
      iconName: "workspace_premium",
      title: "Verifiable Credentials",
      subtitle: "Shareable certificates",
    },
  ];

  const features = [
    {
      iconName: "terminal",
      title: "Industry-Ready Curriculum",
      desc: "Built with modern workflows in mind — Full Stack, AI, Cloud, and DevOps skills that engineering teams actually look for.",
    },
    {
      iconName: "translate",
      title: "Learn in Tamil & English",
      desc: "Clear explanations in both Tamil and English so language is never a barrier to mastering advanced technical concepts.",
    },
    {
      iconName: "verified",
      title: "Verifiable Certificates",
      desc: "Earn digital, cryptographically verifiable certificates that recruiters and hiring managers can validate in seconds.",
    },
    {
      iconName: "payments",
      title: "Accessible & Flexible",
      desc: "Transparent student pricing with Razorpay integration and UPI support. Built from the ground up for Tamil Nadu learners.",
    },
  ];

  const targetCities = [
    "Salem",
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Trichy",
    "Tirunelveli",
    "Erode",
    "Vellore",
    "Thanjavur",
    "Tiruppur",
    "Dindigul",
    "Karur",
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-base)",
          paddingTop: "72px",
          paddingBottom: "72px",
        }}
      >
        {/* Background gradient texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(124,92,252,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(91,127,255,0.08) 0%, transparent 45%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Heading */}
          <h1
            className="text-center max-w-4xl mx-auto"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Tamil Nadu&apos;s First{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7c5cfc 0%, #5b7fff 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Gen Z EdTech
            </span>{" "}
            Platform
          </h1>

          {/* Subtitle */}
          <p
            className="mt-5 text-center max-w-2xl mx-auto"
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.125rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.75,
              fontWeight: 400,
            }}
          >
            From Salem to Chennai — empowering the next generation of Tamil Nadu&apos;s 
            tech workforce. Learn to code, build real products, and prepare for high-impact careers. 
            In Tamil or English, at your own pace.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/courses"
              id="hero-explore-courses-btn"
              className="btn-primary"
              style={{ fontSize: "15px", padding: "13px 32px", borderRadius: "12px" }}
            >
              <span>Explore All Courses</span>
              <GoogleIcon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/auth/register"
              id="hero-join-free-btn"
              className="btn-secondary"
              style={{ fontSize: "15px", padding: "13px 28px", borderRadius: "12px" }}
            >
              Join Free Today
            </Link>
          </div>

          {/* Trust line */}
          <p
            className="mt-6 text-center text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            No credit card required &nbsp;·&nbsp; Start learning in 2 minutes &nbsp;·&nbsp; Tamil & English courses
          </p>

          {/* Value Pillars (Startup-honest, zero fake metric claims) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="p-5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(124,92,252,0.12)",
                    color: "var(--brand-violet)",
                  }}
                >
                  <GoogleIcon name={p.iconName} size={22} />
                </div>
                <div
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                  {p.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scrolling Tech Marquee ──────────────────────── */}
      <section
        aria-label="Partner Organizations"
        className="relative w-full overflow-hidden border-y transition-colors duration-200 py-4 sm:py-5"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Soft edge blur masks */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-36 z-10"
          style={{
            background: "linear-gradient(to right, var(--bg-surface), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-36 z-10"
          style={{
            background: "linear-gradient(to left, var(--bg-surface), transparent)",
          }}
        />

        <div className="flex items-center overflow-hidden">
          <div className="animate-marquee flex items-center gap-10 whitespace-nowrap">
            {[
              "Nexora Techno",
              "Gencode Technologies",
              "Nexora Techno",
              "Gencode Technologies",
              "Nexora Techno",
              "Gencode Technologies",
              "Nexora Techno",
              "Gencode Technologies",
              "Nexora Techno",
              "Gencode Technologies",
              "Nexora Techno",
              "Gencode Technologies",
            ].map((name, idx) => (
              <div key={idx} className="flex items-center gap-10">
                <span className="flex items-center gap-3 font-semibold text-sm sm:text-base tracking-tight text-neutral-800 dark:text-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-sm" />
                  <span className="font-bold tracking-tight">{name}</span>
                </span>
                <span className="text-violet-500/40 text-xs select-none">✦</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About GenZNex ────────────────────────────────── */}
      <section
        id="about"
        className="transition-colors duration-200"
        style={{ backgroundColor: "var(--bg-surface)", padding: "80px 0" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <div>
              <span
                className="inline-block mb-4 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--brand-violet)" }}
              >
                About GenZNex
              </span>
              <h2
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  lineHeight: 1.2,
                }}
              >
                Built in Salem,<br />for every town across Tamil Nadu
              </h2>
              <p
                className="mt-5"
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.85,
                  fontSize: "15px",
                }}
              >
                GenZNex is a new EdTech initiative started with a direct purpose — ensuring students 
                and fresh graduates across Tier-2 and Tier-3 towns have access to modern tech education 
                in Tamil and English, taught through practical hands-on building.
              </p>
              <p
                className="mt-4"
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.85,
                  fontSize: "15px",
                }}
              >
                Instead of passive video lectures, our platform focuses on active learning:
                interactive assignments, live cohort doubt-clearing sessions, direct trainer feedback, 
                and verifiable certificates.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <div
                  className="flex items-center gap-3.5 p-4 rounded-xl flex-1 border transition-colors"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(124,92,252,0.15)", color: "var(--brand-violet)" }}
                  >
                    <GoogleIcon name="location_city" size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                      HQ in Salem, TN
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      East Permanur, Anna Park Backside
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3.5 p-4 rounded-xl flex-1 border transition-colors"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(245,166,35,0.15)", color: "var(--brand-amber)" }}
                  >
                    <GoogleIcon name="flag" size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                      Founded 2026
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Next-Gen EdTech for TN
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual side */}
            <div className="relative">
              <div
                className="rounded-2xl p-6 border transition-colors"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <GoogleIcon name="pin_drop" size={18} className="text-[#f5a623]" />
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--brand-amber)" }}
                  >
                    Regions We Target &amp; Serve
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {targetCities.map((city) => (
                    <span
                      key={city}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {city}
                    </span>
                  ))}
                </div>

                {/* Divider */}
                <div
                  className="my-5"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                />

                {/* Platform Guarantees */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "security", text: "DPDP Act 2023 Compliant" },
                    { icon: "accessibility_new", text: "WCAG AA Accessible" },
                    { icon: "language", text: "Tamil & English content" },
                    { icon: "phone_android", text: "Mobile-first experience" },
                  ].map((f) => (
                    <div
                      key={f.text}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <GoogleIcon name={f.icon} size={16} className="text-[#a07af8] shrink-0" />
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why GenZNex ─────────────────────────────────── */}
      <section
        id="why-genznex"
        className="transition-colors duration-200"
        style={{ backgroundColor: "var(--bg-base)", padding: "80px 0" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--brand-violet)" }}
            >
              Why Choose Us
            </span>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                color: "var(--text-primary)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              }}
            >
              Not just video tutorials.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #7c5cfc, #5b7fff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                A structured path to tech mastery.
              </span>
            </h2>
            <p
              className="mt-4 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)", fontSize: "15px" }}
            >
              We focus on genuine learning outcomes: interactive progress tracking, 
              direct trainer doubt clearing, capstone code reviews, and industry-standard tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  animationDelay: `${i * 0.05}s`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,92,252,0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0px)";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(124,92,252,0.1)",
                    color: "var(--brand-violet)",
                  }}
                >
                  <GoogleIcon name={f.iconName} size={24} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────── */}
      <section
        className="transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "72px 0",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-violet-500/10 text-violet-600 dark:text-[#a07af8]">
            <GoogleIcon name="rocket_launch" size={28} />
          </div>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            Ready to start your tech journey?
          </h2>
          <p
            className="mt-4"
            style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.7 }}
          >
            Create your free account today and begin learning with hands-on projects. 
            No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              id="cta-register-btn"
              className="btn-primary"
              style={{ fontSize: "15px", padding: "14px 36px", borderRadius: "12px" }}
            >
              <span>Start Learning Free</span>
              <GoogleIcon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/courses"
              id="cta-browse-btn"
              className="btn-secondary"
              style={{ fontSize: "15px", padding: "14px 28px", borderRadius: "12px" }}
            >
              Browse Courses
            </Link>
          </div>
          <p className="mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
            Designed for students and developers across Salem, Chennai, Coimbatore, Madurai, and beyond.
          </p>
        </div>
      </section>
    </>
  );
}
