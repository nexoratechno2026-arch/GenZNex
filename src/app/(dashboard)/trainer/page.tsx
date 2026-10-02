"use client";

import React from "react";
import { 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  FolderGit2, 
  Sparkles,
  ExternalLink 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";

export default function TrainerDashboardPage() {
  const { userProfile, user } = useAuth();
  const trainerName = userProfile?.displayName || user?.displayName || "Trainer";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-card border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-indigo-950/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 mb-2 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Trainer Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {trainerName}! 👨‍🏫
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Manage your courses, track cohort attendance, and review student capstones.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          New Course Draft
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card glow="purple" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>My Courses</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">3</div>
          <div className="text-[11px] text-purple-300 mt-1">All published</div>
        </Card>

        <Card glow="cyan" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Cohort Students</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">128</div>
          <div className="text-[11px] text-cyan-400 mt-1">Across 2 batches</div>
        </Card>

        <Card glow="emerald" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Pending Reviews</span>
            <FolderGit2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">6</div>
          <div className="text-[11px] text-amber-400 mt-1">Capstone pull requests</div>
        </Card>

        <Card glow="none" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Attendance Logged</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">14</div>
          <div className="text-[11px] text-emerald-400 mt-1">Sessions recorded</div>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course Studio Shell */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Studio &amp; Curriculum</CardTitle>
                <CardDescription>
                  Structured modules, signed video lessons, and resources.
                </CardDescription>
              </div>
              <span className="text-xs bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">
                Phase 1 Shell
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white text-sm">Full-Stack AI Engineer Bootcamp</div>
                  <div className="text-gray-400 mt-0.5">64 Lessons • 5 Projects • ₹4,999</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold text-[11px]">
                    Published
                  </span>
                  <Button variant="outline" size="sm">
                    Edit Curriculum
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white text-sm">Next.js 15 &amp; Cloud Functions Mastery</div>
                  <div className="text-gray-400 mt-0.5">42 Lessons • 3 Projects • ₹3,499</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold text-[11px]">
                    Published
                  </span>
                  <Button variant="outline" size="sm">
                    Edit Curriculum
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews Shell */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Capstone Reviews</CardTitle>
              <CardDescription>Student code submissions awaiting grade and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Rohan K. - AI Agent Workflow Engine</div>
                  <div className="text-gray-400 mt-0.5">Submitted 2 hours ago • GitHub Repo attached</div>
                </div>
                <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Review Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance & Batch Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch Attendance Manager</CardTitle>
              <CardDescription>Record daily cohort presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 space-y-2">
                <div className="font-bold text-white">Batch Alpha 2026 (Live)</div>
                <div className="text-gray-400">Topic: Event-Driven Cloud Functions</div>
                <Button variant="primary" size="sm" fullWidth leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                  Mark Today&apos;s Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
