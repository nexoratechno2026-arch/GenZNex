"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Users, 
  CalendarCheck, 
  FolderGit2, 
  Briefcase, 
  LayoutDashboard, 
  GraduationCap, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  LogOut,
  ChevronRight,
  Zap,
  CreditCard,
  Tag,
  TrendingUp,
  Mic,
  FileText,
  Calendar,
  Rocket,
  Code2,
  Building2,
  Trophy,
  Flame,
  Award,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/types/schema";
import { useAuth } from "@/lib/context/AuthContext";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout, userProfile, user } = useAuth();

  const studentNavItems = [
    { label: "Overview", href: "/student", icon: LayoutDashboard },
    { label: "My Courses", href: "/student/courses", icon: BookOpen },
    // --- Phase 6: Gamification & Community ---
    { label: "Achievements & XP", href: "/student/achievements", icon: Flame },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Doubt Clearing Forum", href: "/forum", icon: MessageSquare },
    { label: "Notifications", href: "/notifications", icon: Bell },
    // --- Phase 5: Training Module ---
    { label: "My Training", href: "/student/training", icon: Rocket },
    { label: "Live Schedule", href: "/student/schedule", icon: Calendar },
    { label: "Projects", href: "/student/projects", icon: Code2 },
    { label: "Mock Interviews", href: "/student/interviews", icon: Mic },
    { label: "Resume & Placement", href: "/student/placement/resume", icon: FileText },
    { label: "Job Board", href: "/jobs", icon: Briefcase },
    // --- Core ---
    { label: "My Certificates", href: "/student/certificates", icon: GraduationCap },
    { label: "Payments & Invoices", href: "/student/payments", icon: CreditCard },
  ];

  const trainerNavItems = [
    { label: "Overview", href: "/trainer", icon: LayoutDashboard },
    { label: "Course Studio", href: "/trainer/courses", icon: BookOpen },
    // --- Phase 6: Analytics & Forum ---
    { label: "Cohort Analytics", href: "/trainer/analytics", icon: BarChart3 },
    { label: "Doubts & Forum", href: "/forum", icon: MessageSquare },
    { label: "Notifications", href: "/notifications", icon: Bell },
    // --- Phase 5: Training Module ---
    { label: "My Batches", href: "/trainer/batches", icon: Users },
    { label: "Mark Attendance", href: "/trainer/attendance", icon: CalendarCheck },
    { label: "Projects & Grading", href: "/trainer/projects", icon: Code2 },
    { label: "Interviews", href: "/trainer/interviews", icon: Mic },
    { label: "Student Submissions", href: "/trainer/submissions", icon: FolderGit2 },
  ];

  const adminNavItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    // --- Phase 6: Analytics & Community ---
    { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Community Forum", href: "/forum", icon: MessageSquare },
    { label: "Notifications", href: "/notifications", icon: Bell },
    // --- Phase 5 & Core ---
    { label: "Course Approvals", href: "/admin/courses", icon: Layers },
    { label: "Training Programs", href: "/admin/programs", icon: Rocket },
    { label: "All Batches", href: "/admin/batches", icon: Users },
    { label: "Job Board Admin", href: "/admin/jobs", icon: Building2 },
    { label: "Payments & Orders", href: "/admin/payments", icon: CreditCard },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Revenue & Taxes", href: "/admin/revenue", icon: TrendingUp },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Security & Rules", href: "/admin/security", icon: ShieldCheck },
    { label: "System Config", href: "/admin/settings", icon: Sliders },
  ];

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "trainer"
      ? trainerNavItems
      : studentNavItems;

  const roleBadgeStyles = {
    student: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    trainer: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    admin: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-gray-800/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px] flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0d0e17] rounded-[11px] flex items-center justify-center text-sm font-bold text-white">
              {(userProfile?.displayName || user?.email || "U")[0]?.toUpperCase()}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">
              {userProfile?.displayName || user?.displayName || "GenZNex Learner"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                  roleBadgeStyles[role]
                }`}
              >
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 px-3 mb-2 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            <span>Dashboard Menu</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-gray-400 group-hover:text-purple-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-gray-800/80 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Back to Landing Page</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
