"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  Flame,
  Sparkles,
  Award,
  Zap,
  ShieldAlert,
  GraduationCap,
  HelpCircle,
  Code,
  Lock,
  CheckCircle2,
  Calendar,
  Trophy
} from "lucide-react";
import type { UserGamificationDoc, BadgeDoc } from "@/types/schema";

export default function StudentAchievementsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserGamificationDoc | null>(null);
  const [badges, setBadges] = useState<BadgeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGamificationData() {
      if (!user) return;
      try {
        // Load User Gamification Profile
        const profileRef = doc(db, "users", user.uid, "gamification", "profile");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserGamificationDoc);
        } else {
          // Default state
          setProfile({
            userId: user.uid,
            totalXp: 820,
            currentLevel: 3,
            levelName: "Achiever",
            xpToNextLevel: 680,
            currentStreak: 12,
            longestStreak: 12,
            lastActiveDate: new Date().toISOString().split("T")[0],
            streakFreezesRemaining: 1,
            leaderboardOptOut: false,
            earnedBadgeIds: ["badge_first_lesson", "badge_streak_7", "badge_perfect_score"],
            updatedAt: null,
          });
        }

        // Load Badges Catalog
        const badgesSnap = await getDocs(collection(db, "badges"));
        if (!badgesSnap.empty) {
          setBadges(badgesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BadgeDoc)));
        } else {
          setBadges([
            { id: "badge_first_lesson", name: "First Step", description: "Completed your very first lesson on GenZNex", icon: "Sparkles", category: "learning", criteriaType: "count", threshold: 1, order: 1 },
            { id: "badge_module_master", name: "Module Master", description: "Successfully finished all curriculum lessons in a module", icon: "Award", category: "learning", criteriaType: "count", threshold: 1, order: 1.5 },
            { id: "badge_streak_7", name: "On Fire (7-Day)", description: "Maintained a 7-day continuous learning streak", icon: "Flame", category: "streak", criteriaType: "streak", threshold: 7, order: 2 },
            { id: "badge_streak_30", name: "Unstoppable (30-Day)", description: "Crushed a 30-day learning streak in Asia/Kolkata timezone", icon: "Zap", category: "streak", criteriaType: "streak", threshold: 30, order: 3 },
            { id: "badge_perfect_score", name: "Perfectionist", description: "Scored 100% on a technical assessment checkpoint", icon: "Award", category: "learning", criteriaType: "score", threshold: 100, order: 4 },
            { id: "badge_project_pro", name: "Full Stack Builder", description: "Capstone project graded and approved by a senior mentor", icon: "Code", category: "milestone", criteriaType: "special", threshold: 1, order: 5 },
            { id: "badge_course_completer", name: "Course Graduate", description: "Successfully completed 100% of an engineering track", icon: "GraduationCap", category: "milestone", criteriaType: "special", threshold: 1, order: 6 },
            { id: "badge_forum_helper", name: "Community Hero", description: "Provided an answer that was accepted as the verified solution", icon: "HelpCircle", category: "community", criteriaType: "count", threshold: 1, order: 7 },
          ]);
        }
      } catch (err) {
        console.error("Failed to load achievements:", err);
      } finally {
        setLoading(false);
      }
    }

    loadGamificationData();
  }, [user]);

  const earnedBadgeIds = new Set(profile?.earnedBadgeIds || []);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame": return <Flame className="w-6 h-6 text-amber-400" />;
      case "Sparkles": return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case "Award": return <Award className="w-6 h-6 text-purple-400" />;
      case "Zap": return <Zap className="w-6 h-6 text-emerald-400" />;
      case "Code": return <Code className="w-6 h-6 text-indigo-400" />;
      case "GraduationCap": return <GraduationCap className="w-6 h-6 text-pink-400" />;
      case "HelpCircle": return <HelpCircle className="w-6 h-6 text-yellow-400" />;
      default: return <Trophy className="w-6 h-6 text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading your achievements &amp; streaks...
      </div>
    );
  }

  const currentLevel = profile?.currentLevel || 1;
  const levelName = profile?.levelName || "Rookie";
  const totalXp = profile?.totalXp || 0;
  const streak = profile?.currentStreak || 0;
  const longestStreak = profile?.longestStreak || 0;
  const freezes = profile?.streakFreezesRemaining || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          Achievements &amp; Learning Streaks
        </h1>
        <p className="text-gray-400 mt-1">
          Track your XP, continuous daily streaks in Asia/Kolkata timezone, and unlocked engineering credentials.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Level & XP Card */}
        <div className="bg-[#12131f] border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-purple-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Player Level</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Level {currentLevel}
            </span>
          </div>
          <div className="text-3xl font-black text-white">{levelName}</div>
          <div className="text-sm text-gray-400 mt-1">{totalXp.toLocaleString()} Total XP Earned</div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Progress to Next Tier</span>
              <span>{profile?.xpToNextLevel ? `${profile.xpToNextLevel} XP needed` : "Max Tier Reached"}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(15, (totalXp % 500) / 5))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Learning Streak Card */}
        <div className="bg-[#12131f] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-amber-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Daily Streak</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Active
            </span>
          </div>
          <div className="text-3xl font-black text-white flex items-center gap-2">
            {streak} Days
          </div>
          <div className="text-sm text-gray-400 mt-1">Longest streak: {longestStreak} days in IST</div>

          <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Streak Freezes:
            </span>
            <span className="font-bold text-cyan-300">{freezes} available (1/week)</span>
          </div>
        </div>

        {/* Badges Tally Card */}
        <div className="bg-[#12131f] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-cyan-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Badges Unlocked</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {earnedBadgeIds.size} / {badges.length}
            </span>
          </div>
          <div className="text-3xl font-black text-white">
            {Math.round((earnedBadgeIds.size / Math.max(1, badges.length)) * 100)}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Engineering milestones achieved</div>

          <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span>Next milestone:</span>
            <span className="font-semibold text-white">30-Day Streak</span>
          </div>
        </div>
      </div>

      {/* 30-Day Streak Calendar Visualization */}
      <div className="bg-[#12131f] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Learning Activity Heatmap (Asia/Kolkata)
          </h2>
          <span className="text-xs text-gray-400">Past 30 Days</span>
        </div>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
          {Array.from({ length: 30 }).map((_, idx) => {
            const isFilled = idx < streak;
            return (
              <div
                key={idx}
                className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${isFilled
                    ? "bg-amber-500/30 border border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20"
                    : "bg-gray-800/40 border border-gray-800 text-gray-600"
                  }`}
                title={`Day ${idx + 1}: ${isFilled ? "Active Learning Verified" : "No Activity"}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Catalog Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          All Badges &amp; Credentials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const isUnlocked = earnedBadgeIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-5 transition-all ${isUnlocked
                    ? "bg-[#141524] border-purple-500/40 shadow-md shadow-purple-500/5 hover:border-purple-500/70"
                    : "bg-[#0f101a] border-gray-800/70 opacity-60"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2.5 ${isUnlocked ? "bg-purple-950/60 border border-purple-500/40" : "bg-gray-900 border border-gray-800"
                    }`}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700/50">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-3">{badge.name}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{badge.description}</p>
                <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="capitalize text-purple-400 font-medium">{badge.category}</span>
                  <span>Threshold: {badge.threshold}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
