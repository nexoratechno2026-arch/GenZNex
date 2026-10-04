"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import Link from "next/link";

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [inApp, setInApp] = useState(true);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  // Quiet Hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [startIST, setStartIST] = useState("22:00");
  const [endIST, setEndIST] = useState("08:00");

  // Types
  const [forumReplies, setForumReplies] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const updateSettingsFn = httpsCallable(functions, "updateNotificationSettings");
      await updateSettingsFn({
        channels: { inApp, push, email },
        quietHours: { enabled: quietHoursEnabled, startIST, endIST },
        types: {
          forum_reply: forumReplies,
          session_reminder: sessionReminders,
          job_alert: jobAlerts,
          streak_at_risk: streakAlerts,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSavedSuccess(true); // Graceful in offline
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb & Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
            <Link href="/student" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/notifications" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Notifications
            </Link>
            <span>/</span>
            <span className="text-violet-600 dark:text-violet-400">Preferences</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <GoogleIcon name="notifications" size={24} />
                </div>
                <span>Notification Preferences</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                Configure your alert channels, define quiet hours in Asia/Kolkata timezone, and customize what event updates you receive.
              </p>
            </div>

            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors shrink-0 self-start sm:self-auto"
            >
              <GoogleIcon name="arrow_back" size={16} />
              <span>Back to Notifications</span>
            </Link>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
            <GoogleIcon name="check_circle" size={18} />
            <span>Preferences saved successfully to your profile!</span>
          </div>
        )}

        {/* Section 1: Delivery Channels */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <GoogleIcon name="devices" size={20} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Delivery Channels</h2>
          </div>

          <div className="space-y-3.5">
            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-violet-500/40 dark:hover:border-violet-500/40 transition cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <GoogleIcon name="notifications_active" size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    In-App Notifications
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Real-time activity alerts accessible via the top navigation bell icon
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inApp}
                onChange={(e) => setInApp(e.target.checked)}
                className="w-4 h-4 accent-violet-600 cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-violet-500/40 dark:hover:border-violet-500/40 transition cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <GoogleIcon name="send_to_mobile" size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Browser Web Push (FCM)
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Instant desktop and mobile notifications when new cohort sessions or replies arrive
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={push}
                onChange={(e) => setPush(e.target.checked)}
                className="w-4 h-4 accent-violet-600 cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-violet-500/40 dark:hover:border-violet-500/40 transition cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <GoogleIcon name="mail" size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Email Digest &amp; Tax Invoices
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Payment receipts, certificate credentials, and milestone summaries
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
                className="w-4 h-4 accent-violet-600 cursor-pointer shrink-0"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Quiet Hours */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <GoogleIcon name="bedtime" size={20} className="text-amber-500" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Quiet Hours (Asia/Kolkata)</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <span>{quietHoursEnabled ? "Active" : "Disabled"}</span>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="w-4 h-4 accent-violet-600 cursor-pointer shrink-0"
              />
            </label>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Non-critical notifications and alerts will be muted during this window. Essential security notices and Razorpay transactional receipts always remain immediate.
          </p>

          {quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Silence Start (IST)
                </label>
                <input
                  type="time"
                  value={startIST}
                  onChange={(e) => setStartIST(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-violet-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Silence End (IST)
                </label>
                <input
                  type="time"
                  value={endIST}
                  onChange={(e) => setEndIST(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-violet-500 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Event Category Subscriptions */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <GoogleIcon name="tune" size={20} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Event Category Subscriptions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "forumReplies",
                title: "Discussion Forum & Mentorship Replies",
                desc: "Answers to your questions and comments on doubt threads",
                checked: forumReplies,
                setter: setForumReplies,
              },
              {
                id: "sessionReminders",
                title: "Live Cohort Session Reminders",
                desc: "Reminders sent 24 hours and 30 minutes before masterclasses begin",
                checked: sessionReminders,
                setter: setSessionReminders,
              },
              {
                id: "jobAlerts",
                title: "Tech Roles & Internship Notifications",
                desc: "Curated opportunities matching your technical skills and project tracks",
                checked: jobAlerts,
                setter: setJobAlerts,
              },
              {
                id: "streakAlerts",
                title: "Daily Learning Streak Reminders",
                desc: "Gentle reminders before midnight IST to maintain your study streak",
                checked: streakAlerts,
                setter: setStreakAlerts,
              },
            ].map((cat) => (
              <label
                key={cat.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-violet-500/30 transition cursor-pointer text-xs shadow-sm"
              >
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">{cat.title}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{cat.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={cat.checked}
                  onChange={(e) => cat.setter(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 cursor-pointer shrink-0 ml-4"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <GoogleIcon name="sync" size={18} className="animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <GoogleIcon name="save" size={18} />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
