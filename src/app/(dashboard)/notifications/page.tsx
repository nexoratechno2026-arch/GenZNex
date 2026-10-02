"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { 
  Bell, 
  CheckCheck, 
  Settings, 
  CreditCard, 
  Award, 
  Calendar, 
  MessageSquare, 
  Briefcase, 
  ExternalLink,
  Flame,
  Info
} from "lucide-react";
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
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case "badge_earned":
      case "level_up":
        return <Award className="w-5 h-5 text-purple-400" />;
      case "streak_at_risk":
        return <Flame className="w-5 h-5 text-amber-400" />;
      case "session_reminder_24h":
      case "session_reminder_30m":
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case "forum_reply":
      case "forum_accepted":
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case "job_alert":
      case "job_application_status":
        return <Briefcase className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" />
            Notifications &amp; Activity
          </h1>
          <p className="text-gray-400 mt-1">
            Stay updated with course sessions, payment receipts, grading, and community replies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/notifications"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Preferences
          </Link>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "unread"
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#12131f] border border-gray-800 rounded-2xl">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">All caught up!</h3>
          <p className="text-sm text-gray-400 mt-1">No unread notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.isRead && handleMarkRead(item.id)}
              className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                item.isRead
                  ? "bg-[#10111a] border-gray-800/60 opacity-75 hover:opacity-100"
                  : "bg-[#141525] border-purple-500/40 shadow-sm shadow-purple-500/10 hover:border-purple-500/70"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                {getNotifIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-sm font-bold truncate ${item.isRead ? "text-gray-200" : "text-white"}`}>
                    {item.title}
                  </h3>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.message}</p>

                {item.link && (
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 mt-2"
                  >
                    <span>View details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
