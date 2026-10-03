"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "../theme/ThemeProvider";
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Zap, 
  LayoutDashboard,
  LogOut,
  Bell,
  Trophy,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import type { UserRole } from "@/types/schema";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "../ui/Button";

interface NavbarProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  isEmulatorActive?: boolean;
}

export function Navbar({ currentRole }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, role: contextRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = currentRole || contextRole || "student";

  const dashboardHref =
    activeRole === "admin"
      ? "/admin"
      : activeRole === "trainer"
      ? "/trainer"
      : "/student";

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-gray-800/80 bg-[#090a0f]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0e17] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xl leading-none flex items-center gap-1">
                <span className="text-white">GenZ</span>
                <span className="glow-text-gradient">Nex</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mt-0.5">
                EdTech India
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link 
            href="/courses" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Courses</span>
          </Link>
          <Link 
            href="/programs" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Programs</span>
          </Link>
          <Link 
            href="/forum" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Doubts</span>
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </Link>
          <Link 
            href="/jobs" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>Jobs</span>
          </Link>
        </nav>

        {/* Action Controls: Auth Status & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Dark / Light Theme"
            className="p-2 rounded-xl border border-gray-800 bg-[#141525] text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors shadow-sm"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link 
                href="/notifications"
                title="Notifications"
                className="relative p-2 rounded-xl border border-gray-800 bg-[#141525] text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors"
                id="nav-notifications-btn"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              </Link>
              <Link href={dashboardHref}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                  id="nav-dashboard-btn"
                >
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 rounded-xl border border-gray-800 bg-[#141525] text-rose-400 hover:bg-rose-500/10 transition-colors"
                id="nav-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" id="nav-login-btn">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm" id="nav-signup-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-gray-800 bg-[#141525] text-gray-300"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
          </button>
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-gray-800 bg-[#141525] text-gray-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 border-t border-gray-800 bg-[#0d0e17] space-y-4">
          <div className="flex flex-col gap-1 font-medium text-sm">
            <Link 
              href="/courses" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Courses</span>
            </Link>
            <Link 
              href="/programs" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Cohort Programs</span>
            </Link>
            <Link 
              href="/forum" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Doubts &amp; Discussion</span>
            </Link>
            <Link 
              href="/leaderboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </Link>
            <Link 
              href="/jobs" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Placement Jobs</span>
            </Link>
          </div>

          {/* Auth options in mobile menu */}
          <div className="pt-2 border-t border-gray-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-600/30"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl border border-gray-800 text-center font-bold text-xs text-gray-300 hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl bg-purple-600 text-center font-bold text-xs text-white shadow-md shadow-purple-600/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
