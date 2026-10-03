"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "../theme/ThemeProvider";
import type { UserRole } from "@/types/schema";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "../ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

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
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo - Pure Black & White Arial */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-white light:bg-black flex items-center justify-center text-black dark:text-black light:text-white font-bold">
              <GoogleIcon name="bolt" size={22} filled />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-xl leading-none text-white dark:text-white light:text-black">
                GenZNex
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mt-0.5">
                EdTech India
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link 
            href="/courses" 
            className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GoogleIcon name="school" size={18} />
            <span>Courses</span>
          </Link>
          <Link 
            href="/programs" 
            className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GoogleIcon name="workspace_premium" size={18} />
            <span>Programs</span>
          </Link>
          <Link 
            href="/forum" 
            className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GoogleIcon name="forum" size={18} />
            <span>Doubts</span>
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GoogleIcon name="leaderboard" size={18} />
            <span>Leaderboard</span>
          </Link>
          <Link 
            href="/jobs" 
            className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GoogleIcon name="work" size={18} />
            <span>Jobs</span>
          </Link>
        </nav>

        {/* Right Section: Notifications, Theme Toggle, Auth/Dashboard */}
        <div className="flex items-center gap-3">
          
          {/* Notifications link */}
          <Link
            href="/notifications"
            className="p-2 text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black rounded-md transition-colors"
            title="Notifications"
          >
            <GoogleIcon name="notifications" size={20} />
          </Link>

          {/* Theme Toggle (Night / Light) with Google Icons */}
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black rounded-md transition-colors cursor-pointer border border-neutral-800 dark:border-neutral-800 light:border-neutral-300"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Night Mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <GoogleIcon name="light_mode" size={18} />
            ) : (
              <GoogleIcon name="dark_mode" size={18} />
            )}
          </button>

          {/* User state or login buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link href={dashboardHref}>
                <Button 
                  size="sm" 
                  className="bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black dark:hover:bg-neutral-200 light:bg-black light:text-white light:hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 flex items-center gap-1.5 rounded"
                >
                  <GoogleIcon name="dashboard" size={16} />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black rounded-md transition-colors cursor-pointer"
                title="Sign out"
              >
                <GoogleIcon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black font-semibold text-xs px-3 py-1.5"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button 
                  size="sm" 
                  className="bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black dark:hover:bg-neutral-200 light:bg-black light:text-white light:hover:bg-neutral-800 font-bold text-xs px-3.5 py-1.5 rounded"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black rounded-md cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <GoogleIcon name="close" size={22} />
            ) : (
              <GoogleIcon name="menu" size={22} />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white px-4 py-4 space-y-3">
          <Link 
            href="/courses" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 py-2 font-medium"
          >
            <GoogleIcon name="school" size={18} />
            <span>Courses</span>
          </Link>
          <Link 
            href="/programs" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 py-2 font-medium"
          >
            <GoogleIcon name="workspace_premium" size={18} />
            <span>Programs</span>
          </Link>
          <Link 
            href="/forum" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 py-2 font-medium"
          >
            <GoogleIcon name="forum" size={18} />
            <span>Doubts</span>
          </Link>
          <Link 
            href="/leaderboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 py-2 font-medium"
          >
            <GoogleIcon name="leaderboard" size={18} />
            <span>Leaderboard</span>
          </Link>
          <Link 
            href="/jobs" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 py-2 font-medium"
          >
            <GoogleIcon name="work" size={18} />
            <span>Jobs</span>
          </Link>
        </div>
      )}
    </header>
  );
}
