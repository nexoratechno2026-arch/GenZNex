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
  ShieldCheck, 
  UserCheck, 
  Layers, 
  ExternalLink,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Bell,
  Trophy,
  MessageSquare,
} from "lucide-react";
import type { UserRole } from "@/types/schema";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "../ui/Button";

interface NavbarProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  isEmulatorActive?: boolean;
}

export function Navbar({ currentRole, onRoleChange, isEmulatorActive = true }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, role: contextRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = currentRole || contextRole;

  const dashboardHref =
    activeRole === "admin"
      ? "/admin"
      : activeRole === "trainer"
      ? "/trainer"
      : "/student";

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
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

          {/* Emulator Status Indicator Badge */}
          {isEmulatorActive && (
            <div className="hidden lg:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-indicator" />
              <span>Firebase Emulators Active</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                Demo
              </span>
            </div>
          )}
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link 
            href="/#courses" 
            className="text-gray-300 hover:text-white transition-colors"
          >
            Courses
          </Link>
          <Link 
            href="/forum" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Doubts</span>
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </Link>
          <Link 
            href="/#emulator-status" 
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Architecture &amp; Rules</span>
          </Link>
          <a 
            href="http://127.0.0.1:4000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs"
          >
            <span>Emulator UI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Action Controls: Auth Status, Role Switcher & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          
          {/* RBAC Role Switcher (Visible in dev emulator) */}
          {onRoleChange && (
            <div className="flex items-center bg-[#161928] border border-gray-700/60 rounded-lg p-1 text-xs">
              <span className="px-2 text-gray-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                Role:
              </span>
              {(["student", "trainer", "admin"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  id={`role-btn-${role}`}
                  onClick={() => onRoleChange(role)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                    activeRole === role
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-600/50"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Dark / Light Theme"
            className="p-2 rounded-lg border border-gray-700/60 bg-[#161928] text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* User Auth Buttons / Profile Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                href="/notifications"
                title="Notifications"
                className="relative p-2 rounded-lg border border-gray-700/60 bg-[#161928] text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors"
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
                className="p-2 rounded-lg border border-gray-700/60 bg-[#161928] text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-gray-700/60 bg-[#161928] text-gray-300"
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
            className="p-2 rounded-lg border border-gray-700/60 bg-[#161928] text-gray-300"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-3 pb-6 border-t border-gray-800 bg-[#0d0e17] space-y-4">
          <div className="flex flex-col gap-2 font-medium text-sm">
            <Link 
              href="/#courses" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200"
            >
              Courses
            </Link>
            <Link 
              href="/#emulator-status" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-gray-200 flex items-center justify-between"
            >
              <span>Architecture &amp; Security</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </Link>
            <a 
              href="http://127.0.0.1:4000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 text-cyan-400 flex items-center justify-between"
            >
              <span>Emulator UI (Port 4000)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Auth options in mobile menu */}
          <div className="pt-2 border-t border-gray-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to {activeRole.toUpperCase()} Dashboard</span>
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
                  className="py-2.5 rounded-xl border border-gray-800 text-center font-bold text-xs text-gray-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl bg-purple-600 text-center font-bold text-xs text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Role switcher in mobile menu */}
          {onRoleChange && (
            <div className="pt-2 border-t border-gray-800">
              <div className="text-xs text-gray-400 mb-2">Simulate Role:</div>
              <div className="grid grid-cols-3 gap-1 bg-[#161928] p-1 rounded-lg">
                {(["student", "trainer", "admin"] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(role);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 text-xs text-center rounded capitalize font-medium ${
                      activeRole === role
                        ? "bg-purple-600 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
