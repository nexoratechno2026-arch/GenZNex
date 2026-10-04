"use client";

import React, { useEffect, useState } from "react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Card } from "@/components/ui/Card";

export default function TrainerAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white flex items-center gap-3">
          <GoogleIcon name="analytics" size={28} />
          Trainer Cohort &amp; Curriculum Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
          Monitor student progression, lesson drop-offs, assessment difficulty, and unresolved doubt tickets.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-5">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mb-2 flex items-center justify-between">
            <span>Enrolled Students</span>
            <GoogleIcon name="groups" size={18} />
          </div>
          <div className="text-2xl font-black text-black dark:text-white">431</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Across active courses &amp; batches</div>
        </Card>

        <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-5">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mb-2 flex items-center justify-between">
            <span>Avg Course Progress</span>
            <GoogleIcon name="trending_up" size={18} />
          </div>
          <div className="text-2xl font-black text-black dark:text-white">68.4%</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">High retention across cohorts</div>
        </Card>

        <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-5">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mb-2 flex items-center justify-between">
            <span>Unresolved Doubts</span>
            <GoogleIcon name="help" size={18} />
          </div>
          <div className="text-2xl font-black text-black dark:text-white">2</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Awaiting mentor verification</div>
        </Card>

        <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-5">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mb-2 flex items-center justify-between">
            <span>Instructor Rating</span>
            <GoogleIcon name="workspace_premium" size={18} />
          </div>
          <div className="text-2xl font-black text-black dark:text-white">4.9 / 5.0</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Based on 124 verified reviews</div>
        </Card>
      </div>

      {/* Lesson Retention & Drop-Off Table */}
      <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-black dark:text-white">Lesson Drop-Off &amp; Completion Retention</h2>
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
                <span className="text-neutral-700 dark:text-neutral-300">{item.lesson}</span>
                <span className="text-black dark:text-white font-bold">{item.completion}% Completion ({item.dropoff} drop-off)</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                  style={{ width: `${item.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
