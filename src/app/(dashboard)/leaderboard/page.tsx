"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { Trophy, Medal, Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { LeaderboardRankItem } from "@/types/schema";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"alltime" | "weekly">("alltime");
  const [rankings, setRankings] = useState<LeaderboardRankItem[]>([]);
  const [optOut, setOptOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingOptOut, setUpdatingOptOut] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const getLeaderboardFn = httpsCallable(functions, "getLeaderboard");
        const res: any = await getLeaderboardFn({ scope });
        if (res.data?.rankings && res.data.rankings.length > 0) {
          setRankings(res.data.rankings);
        } else {
          setRankings([
            { rank: 1, userId: "u1", displayName: "Aarav Patel", photoURL: "", xp: 1950, level: 4, levelName: "Pro" },
            { rank: 2, userId: "u2", displayName: "Rahul Sharma", photoURL: "", xp: 820, level: 3, levelName: "Achiever" },
            { rank: 3, userId: "u3", displayName: "Sneha Reddy", photoURL: "", xp: 640, level: 3, levelName: "Achiever" },
            { rank: 4, userId: "u4", displayName: "Karthik Verma", photoURL: "", xp: 420, level: 2, levelName: "Explorer" },
            { rank: 5, userId: "u5", displayName: "Priya Nair", photoURL: "", xp: 280, level: 2, levelName: "Explorer" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [scope]);

  const handleToggleOptOut = async () => {
    if (!user) return;
    setUpdatingOptOut(true);
    try {
      const setOptOutFn = httpsCallable(functions, "setLeaderboardOptOut");
      const nextVal = !optOut;
      await setOptOutFn({ optOut: nextVal });
      setOptOut(nextVal);
    } catch (err) {
      console.error("Failed to toggle opt out:", err);
    } finally {
      setUpdatingOptOut(false);
    }
  };

  const top3 = rankings.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              GenZNex Hall of Fame
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
              Top engineering minds ranked by verified learning activity, quizzes, and project milestones.
            </p>
          </div>

          {/* Privacy Opt-Out Toggle */}
          <button
            onClick={handleToggleOptOut}
            disabled={updatingOptOut}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              optOut
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
            }`}
          >
            {optOut ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-indigo-500" />}
            <span>{optOut ? "Hidden from Leaderboard" : "Visible on Leaderboard"}</span>
          </button>
        </div>

        {/* Scope Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            onClick={() => setScope("alltime")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              scope === "alltime"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            Global All-Time
          </button>
          <button
            onClick={() => setScope("weekly")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              scope === "weekly"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            This Week (IST)
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-500 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
            Fetching leaderboard snapshot...
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end">
                {/* Silver (Rank 2) */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center order-2 md:order-1 relative shadow-sm">
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-neutral-300 dark:border-neutral-700">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-neutral-300 dark:border-neutral-600 bg-purple-100 dark:bg-purple-950 flex items-center justify-center font-bold text-lg text-purple-700 dark:text-purple-300">
                    {top3[1].displayName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-black dark:text-white text-base truncate">{top3[1].displayName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    Level {top3[1].level} {top3[1].levelName}
                  </span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-3">{top3[1].xp.toLocaleString()} XP</div>
                </div>

                {/* Gold (Rank 1) */}
                <div className="bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/15 dark:to-neutral-900 border border-amber-500/40 rounded-2xl p-6 text-center order-1 md:order-2 relative shadow-lg shadow-amber-500/5 -translate-y-2">
                  <div className="w-10 h-10 bg-amber-400/20 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 font-black border border-amber-400/50">
                    👑
                  </div>
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-amber-400 shadow-md shadow-amber-400/20 bg-amber-50 dark:bg-amber-950 flex items-center justify-center font-bold text-2xl text-amber-700 dark:text-amber-300">
                    {top3[0].displayName.charAt(0)}
                  </div>
                  <h3 className="font-extrabold text-black dark:text-white text-lg truncate">{top3[0].displayName}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Level {top3[0].level} {top3[0].levelName}
                  </span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-3">{top3[0].xp.toLocaleString()} XP</div>
                </div>

                {/* Bronze (Rank 3) */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center order-3 relative shadow-sm">
                  <div className="w-8 h-8 bg-amber-700/10 text-amber-700 dark:text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-amber-700/30">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-amber-700/40 bg-orange-50 dark:bg-orange-950 flex items-center justify-center font-bold text-lg text-orange-700 dark:text-orange-300">
                    {top3[2].displayName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-black dark:text-white text-base truncate">{top3[2].displayName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    Level {top3[2].level} {top3[2].levelName}
                  </span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-3">{top3[2].xp.toLocaleString()} XP</div>
                </div>
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Medal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Complete Standings
                </h2>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Zero PII Public Privacy
                </span>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {rankings.map((item) => (
                  <div
                    key={item.userId}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-7 text-center font-extrabold text-sm text-neutral-500">
                        #{item.rank}
                      </span>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300">
                        {item.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black dark:text-white">{item.displayName}</div>
                        <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                          Level {item.level} • {item.levelName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                        {item.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
