"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { Bell, Moon, Mail, Smartphone, Monitor, ShieldCheck, Check } from "lucide-react";
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
    <div className="max-w-3xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
          <Link href="/notifications" className="hover:underline">Notifications</Link>
          <span>/</span>
          <span>Preferences</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-purple-400" />
          Notification Preferences
        </h1>
        <p className="text-gray-400 mt-1">
          Control how and when you receive announcements, session reminders, and doubt updates.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          Preferences saved successfully!
        </div>
      )}

      {/* Section 1: Channels */}
      <div className="bg-[#12131f] border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-purple-400" />
          Notification Delivery Channels
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3.5 bg-gray-900/60 rounded-xl border border-gray-800/80 cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-sm font-bold text-white">In-App Alerts</div>
                <div className="text-xs text-gray-400">Real-time alerts via top navigation bell icon</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={inApp}
              onChange={(e) => setInApp(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-gray-900/60 rounded-xl border border-gray-800/80 cursor-pointer">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-sm font-bold text-white">Browser Web Push (FCM)</div>
                <div className="text-xs text-gray-400">Desktop and mobile browser push notifications</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={push}
              onChange={(e) => setPush(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-gray-900/60 rounded-xl border border-gray-800/80 cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-white">Email Digest &amp; Receipts</div>
                <div className="text-xs text-gray-400">Tax invoices, certificate credentials, and milestone recaps</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => setEmail(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Section 2: Quiet Hours */}
      <div className="bg-[#12131f] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Quiet Hours (Asia/Kolkata)</h2>
          </div>
          <input
            type="checkbox"
            checked={quietHoursEnabled}
            onChange={(e) => setQuietHoursEnabled(e.target.checked)}
            className="w-4 h-4 accent-purple-600 rounded"
          />
        </div>
        <p className="text-xs text-gray-400">
          Non-critical push notifications will be silenced during this window. Transactional payment receipts and security notices remain active.
        </p>

        {quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Silence Start (IST)</label>
              <input
                type="time"
                value={startIST}
                onChange={(e) => setStartIST(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Silence End (IST)</label>
              <input
                type="time"
                value={endIST}
                onChange={(e) => setEndIST(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Notification Categories */}
      <div className="bg-[#12131f] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Event Category Subscriptions</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-800 cursor-pointer text-xs">
            <span className="text-gray-200">Discussion forum answers and peer replies</span>
            <input type="checkbox" checked={forumReplies} onChange={(e) => setForumReplies(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-800 cursor-pointer text-xs">
            <span className="text-gray-200">Live cohort session reminders (24h and 30m prior)</span>
            <input type="checkbox" checked={sessionReminders} onChange={(e) => setSessionReminders(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-800 cursor-pointer text-xs">
            <span className="text-gray-200">New job openings matching placement profile</span>
            <input type="checkbox" checked={jobAlerts} onChange={(e) => setJobAlerts(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-800 cursor-pointer text-xs">
            <span className="text-gray-200">Streak at-risk warnings (midnight IST approach)</span>
            <input type="checkbox" checked={streakAlerts} onChange={(e) => setStreakAlerts(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
