"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import type { UserRole } from "@/types/schema";
import { useAuth } from "@/lib/context/AuthContext";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout, userProfile, user } = useAuth();

  const studentNavItems = [
    { label: "Overview", href: "/student", icon: "dashboard" },
    { label: "My Courses", href: "/student/courses", icon: "school" },
    { label: "Certificates", href: "/student/certificates", icon: "workspace_premium" },
    { label: "Achievements & XP", href: "/student/achievements", icon: "stars" },
    { label: "Leaderboard", href: "/leaderboard", icon: "leaderboard" },
    { label: "Doubts Forum", href: "/forum", icon: "forum" },
    { label: "Notifications", href: "/notifications", icon: "notifications" },
    { label: "Live Sprints", href: "/student/training", icon: "terminal" },
    { label: "Live Schedule", href: "/student/schedule", icon: "calendar_today" },
    { label: "Interview Prep", href: "/student/interviews", icon: "record_voice_over" },
    { label: "Tech Opportunities", href: "/jobs", icon: "work" },
  ];

  const trainerNavItems = [
    { label: "Trainer Studio", href: "/trainer", icon: "dashboard" },
    { label: "My Courses", href: "/trainer/courses", icon: "school" },
    { label: "Course Wizard", href: "/trainer/courses/new", icon: "add_circle" },
    { label: "Assignment Grading", href: "/trainer/submissions", icon: "assignment" },
    { label: "Cohort Batches", href: "/trainer/batches", icon: "groups" },
    { label: "Trainer Analytics", href: "/trainer/analytics", icon: "analytics" },
    { label: "Doubts Forum", href: "/forum", icon: "forum" },
  ];

  const adminNavItems = [
    { label: "Executive Dashboard", href: "/admin", icon: "dashboard" },
    { label: "Course Approvals", href: "/admin/courses", icon: "verified" },
    { label: "Payments & Refunds", href: "/admin/payments", icon: "receipt_long" },
    { label: "Revenue & Ledger", href: "/admin/revenue", icon: "payments" },
    { label: "Discount Coupons", href: "/admin/coupons", icon: "sell" },
    { label: "Platform Analytics", href: "/admin/analytics", icon: "analytics" },
    { label: "Curriculum Cohorts", href: "/programs", icon: "layers" },
    { label: "Job Opportunities", href: "/jobs", icon: "work" },
  ];

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "trainer"
      ? trainerNavItems
      : studentNavItems;

  return (
    <aside className="w-full md:w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 flex flex-col justify-between shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto">
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {(userProfile?.displayName || user?.email || "U")[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Learner"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-3 mb-2 flex items-center gap-1">
            <GoogleIcon name="menu" size={14} />
            <span>Dashboard Menu</span>
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GoogleIcon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </div>
                {isActive && <GoogleIcon name="chevron_right" size={16} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1 mt-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <GoogleIcon name="home" size={16} />
          <span>Home Page</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer text-left"
        >
          <GoogleIcon name="logout" size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
