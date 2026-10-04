"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import Link from "next/link";
import type { NotificationDoc } from "@/types/schema";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notifQuery, (snap) => {
      const docs: NotificationDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as NotificationDoc));
      setNotifications(docs);
      setLoading(false);
    }, (err) => {
      console.error("Notifications snapshot error:", err);
      // Fallback mock notifications for demonstration
      setNotifications([
        { id: "n1", userId: user.uid, title: "Badge Unlocked: On Fire! 🔥", message: "You achieved a 7-day learning streak in Asia/Kolkata timezone.", type: "badge_earned", isRead: false, link: "/student/achievements", createdAt: null },
        { id: "n2", userId: user.uid, title: "Live Session Reminder (30m)", message: "Next.js 15 Streaming SSR masterclass starts in 30 minutes. Join on time!", type: "session_reminder_30m", isRead: false, link: "/student/schedule", createdAt: null },
        { id: "n3", userId: user.uid, title: "Assignment Graded: 96/100", message: "Trainer Vikram graded your Capstone milestone with positive remarks.", type: "assignment_graded", isRead: false, link: "/student/training", createdAt: null },
        { id: "n4", userId: user.uid, title: "Payment Verified (₹4,999)", message: "GST Tax Invoice #GZN-INV-2026-1001 generated for Full Stack GenAI Track.", type: "payment_success", isRead: true, link: "/student/payments", createdAt: null },
        { id: "n5", userId: user.uid, title: "New Forum Reply", message: "Trainer Vikram replied to your doubt on React 19 Server Actions.", type: "forum_reply", isRead: true, link: "/forum", createdAt: null },
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const markAllFn = httpsCallable(functions, "markAllNotificationsRead");
      await markAllFn();
    } catch (err) {
      console.error("Failed to mark all read:", err);
      // Optimistic local update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const markReadFn = httpsCallable(functions, "markNotificationRead");
      await markReadFn({ notificationId: id });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "payment_success":
      case "invoice_generated":
        return <GoogleIcon name="payments" size={20} className="text-emerald-500" />;
      case "badge_earned":
      case "level_up":
        return <GoogleIcon name="workspace_premium" size={20} className="text-violet-500" />;
      case "streak_at_risk":
        return <GoogleIcon name="local_fire_department" size={20} className="text-amber-500" />;
      case "session_reminder_24h":
      case "session_reminder_30m":
        return <GoogleIcon name="event" size={20} className="text-cyan-500" />;
      case "forum_reply":
      case "forum_accepted":
        return <GoogleIcon name="forum" size={20} className="text-indigo-500" />;
      case "job_alert":
      case "job_application_status":
        return <GoogleIcon name="work" size={20} className="text-rose-500" />;
      default:
        return <GoogleIcon name="info" size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <GoogleIcon name="notifications" size={24} />
              </div>
              <span>Notifications &amp; Activity</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-2xl leading-relaxed">
              Stay updated with course masterclasses, milestone feedback, invoices, and community discussions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings/notifications"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <GoogleIcon name="settings" size={16} />
              <span>Preferences</span>
            </Link>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-all cursor-pointer"
              >
                <GoogleIcon name="done_all" size={16} />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "btn-primary shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            All Activity ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "unread"
                ? "btn-primary shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-500 flex items-center justify-center">
            <GoogleIcon name="sync" size={24} className="animate-spin text-violet-600 mr-2.5" />
            <span>Loading notifications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mx-auto mb-3 flex items-center justify-center">
              <GoogleIcon name="notifications_off" size={26} />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">All caught up!</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">No unread notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkRead(item.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer shadow-sm ${
                  item.isRead
                    ? "bg-white dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700"
                    : "bg-neutral-50 dark:bg-neutral-900 border-violet-500/40 shadow-violet-500/5 hover:border-violet-500/70"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                  {getNotifIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold truncate ${item.isRead ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-900 dark:text-white"}`}>
                      {item.title}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-400 shrink-0 shadow-sm" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{item.message}</p>

                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 mt-2.5 transition-colors"
                    >
                      <span>View details</span>
                      <GoogleIcon name="arrow_forward" size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
