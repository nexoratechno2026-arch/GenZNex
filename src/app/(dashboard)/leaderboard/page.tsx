"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { Trophy, Medal, Award, Flame, Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { LeaderboardRankItem } from "@/types/schema";

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
          // Fallback mock top rankers
          setRankings([
            { rank: 1, userId: "u1", displayName: "Aarav Patel", photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64", xp: 1950, level: 4, levelName: "Pro" },
            { rank: 2, userId: "u2", displayName: "Rahul Sharma", photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64", xp: 820, level: 3, levelName: "Achiever" },
            { rank: 3, userId: "u3", displayName: "Sneha Reddy", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64", xp: 640, level: 3, levelName: "Achiever" },
            { rank: 4, userId: "u4", displayName: "Karthik Verma", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64", xp: 420, level: 2, levelName: "Explorer" },
            { rank: 5, userId: "u5", displayName: "Priya Nair", photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64", xp: 280, level: 2, levelName: "Explorer" },
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
  const remaining = rankings.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            GenZNex Hall of Fame
          </h1>
          <p className="text-gray-400 mt-1">
            Top engineering minds ranked by verified learning activity, quizzes, and project milestones.
          </p>
        </div>

        {/* Privacy Opt-Out Toggle */}
        <button
          onClick={handleToggleOptOut}
          disabled={updatingOptOut}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            optOut
              ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
              : "bg-gray-800/60 border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          {optOut ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
          <span>{optOut ? "Hidden from Leaderboard" : "Visible on Leaderboard"}</span>
        </button>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setScope("alltime")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            scope === "alltime"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Global All-Time
        </button>
        <button
          onClick={() => setScope("weekly")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            scope === "weekly"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          This Week (IST)
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
          Fetching leaderboard snapshot...
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end">
              {/* Silver (Rank 2) */}
              <div className="bg-[#12131f] border border-gray-700/60 rounded-2xl p-6 text-center order-2 md:order-1 relative">
                <div className="w-8 h-8 bg-gray-300/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-gray-300/40">
                  2
                </div>
                <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-300">
                  <img src={top3[1].photoURL || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64"} alt={top3[1].displayName} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-white text-base truncate">{top3[1].displayName}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300">
                  Level {top3[1].level} {top3[1].levelName}
                </span>
                <div className="text-xl font-black text-amber-400 mt-3">{top3[1].xp.toLocaleString()} XP</div>
              </div>

              {/* Gold (Rank 1) */}
              <div className="bg-gradient-to-b from-amber-500/15 to-[#12131f] border border-amber-500/40 rounded-2xl p-6 text-center order-1 md:order-2 relative shadow-xl shadow-amber-500/10 -translate-y-2">
                <div className="w-10 h-10 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 font-black border border-amber-400/50">
                  👑
                </div>
                <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-amber-400 shadow-md shadow-amber-400/30">
                  <img src={top3[0].photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64"} alt={top3[0].displayName} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-extrabold text-white text-lg truncate">{top3[0].displayName}</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Level {top3[0].level} {top3[0].levelName}
                </span>
                <div className="text-2xl font-black text-amber-300 mt-3">{top3[0].xp.toLocaleString()} XP</div>
              </div>

              {/* Bronze (Rank 3) */}
              <div className="bg-[#12131f] border border-amber-800/40 rounded-2xl p-6 text-center order-3 relative">
                <div className="w-8 h-8 bg-amber-700/20 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-amber-700/40">
                  3
                </div>
                <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-amber-700/60">
                  <img src={top3[2].photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64"} alt={top3[2].displayName} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-white text-base truncate">{top3[2].displayName}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300">
                  Level {top3[2].level} {top3[2].levelName}
                </span>
                <div className="text-xl font-black text-amber-400 mt-3">{top3[2].xp.toLocaleString()} XP</div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-[#12131f] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-purple-400" />
                Complete Standings
              </h2>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero PII Public Privacy
              </span>
            </div>

            <div className="divide-y divide-gray-800/80">
              {rankings.map((item) => (
                <div
                  key={item.userId}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-7 text-center font-extrabold text-sm text-gray-400">
                      #{item.rank}
                    </span>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
                      <img
                        src={item.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64"}
                        alt={item.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{item.displayName}</div>
                      <div className="text-[11px] text-purple-400 font-medium">
                        Level {item.level} • {item.levelName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-amber-400">
                      {item.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
