"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { BookOpen, HelpCircle, CheckCircle, Award, Users } from "lucide-react";

export default function TrainerAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-400" />
          Trainer Cohort &amp; Curriculum Intelligence
        </h1>
        <p className="text-gray-400 mt-1">
          Monitor student progression, lesson drop-offs, assessment difficulty, and unresolved doubt tickets.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#12131f] border border-purple-500/30 rounded-2xl p-5">
          <div className="text-xs text-purple-400 font-semibold mb-2 flex items-center justify-between">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">431</div>
          <div className="text-xs text-gray-400 mt-1">Across active courses &amp; batches</div>
        </div>

        <div className="bg-[#12131f] border border-cyan-500/30 rounded-2xl p-5">
          <div className="text-xs text-cyan-400 font-semibold mb-2 flex items-center justify-between">
            <span>Avg Course Progress</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">68.4%</div>
          <div className="text-xs text-gray-400 mt-1">High retention across cohorts</div>
        </div>

        <div className="bg-[#12131f] border border-amber-500/30 rounded-2xl p-5">
          <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center justify-between">
            <span>Unresolved Doubts</span>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">2</div>
          <div className="text-xs text-gray-400 mt-1">Awaiting mentor verification</div>
        </div>

        <div className="bg-[#12131f] border border-emerald-500/30 rounded-2xl p-5">
          <div className="text-xs text-emerald-400 font-semibold mb-2 flex items-center justify-between">
            <span>Instructor Rating</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">4.9 / 5.0</div>
          <div className="text-xs text-gray-400 mt-1">Based on 124 verified reviews</div>
        </div>
      </div>

      {/* Lesson Retention & Drop-Off Table */}
      <div className="bg-[#12131f] border border-gray-800 rounded-2xl overflow-hidden shadow-lg p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Lesson Drop-Off &amp; Completion Retention</h2>
        <div className="space-y-4">
          {[
            { lesson: "1. Next.js 15 Foundations & Server Components", completion: 94, dropoff: "6%" },
            { lesson: "2. Streaming SSR & Suspense Boundaries", completion: 89, dropoff: "11%" },
            { lesson: "3. Server Actions & Mutations Architecture", completion: 82, dropoff: "18%" },
            { lesson: "4. Vector Databases & AI Agent Swarms", completion: 74, dropoff: "26%" },
            { lesson: "5. Production Deployment on Vercel & Firebase", completion: 68, dropoff: "32%" },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-200">{item.lesson}</span>
                <span className="text-cyan-400">{item.completion}% Completion ({item.dropoff} drop-off)</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                  style={{ width: `${item.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
