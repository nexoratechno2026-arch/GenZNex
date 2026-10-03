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
    { label: "My Training", href: "/student/training", icon: "rocket_launch" },
    { label: "Live Schedule", href: "/student/schedule", icon: "calendar_today" },
    { label: "Mock Interviews", href: "/student/interviews", icon: "mic" },
    { label: "Placement Desk", href: "/jobs", icon: "work" },
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
    { label: "Training Programs", href: "/programs", icon: "rocket_launch" },
    { label: "Placement Pipeline", href: "/jobs", icon: "work" },
  ];

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "trainer"
      ? trainerNavItems
      : studentNavItems;

  return (
    <aside className="w-full md:w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm shrink-0">
            {(userProfile?.displayName || user?.email || "U")[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-black dark:text-white truncate">
              {userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Learner"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.2 rounded uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black">
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
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-all ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-900"
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
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <GoogleIcon name="home" size={16} />
          <span>Home Page</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <GoogleIcon name="logout" size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
