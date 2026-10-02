"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MockInterviewDoc, InterviewerAvailabilityDoc } from "@/types/schema";
import {
  Mic,
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  PlayCircle,
  User,
} from "lucide-react";

interface AvailableSlot {
  interviewerId: string;
  interviewerName: string;
  date: string;
  time: string;
}

export default function StudentInterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<MockInterviewDoc[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<AvailableSlot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // My interviews
        const interviewQ = query(
          collection(db, "mock_interviews"),
          where("studentId", "==", user!.uid),
          orderBy("scheduledDate", "desc")
        );
        const interviewSnap = await getDocs(interviewQ);
        const myInterviews = interviewSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MockInterviewDoc));

        // Available slots for next 14 days
        const today = new Date().toISOString().split("T")[0];
        const next14 = new Date();
        next14.setDate(next14.getDate() + 14);
        const next14Str = next14.toISOString().split("T")[0];

        const availQ = query(
          collection(db, "interviewer_availability"),
          where("date", ">=", today),
          where("date", "<=", next14Str)
        );
        const availSnap = await getDocs(availQ);

        const slots: AvailableSlot[] = [];
        for (const d of availSnap.docs) {
          const data = d.data() as InterviewerAvailabilityDoc;
          for (const slot of data.slots) {
            if (!slot.isBooked) {
              // Get interviewer name
              slots.push({
                interviewerId: data.interviewerId,
                interviewerName: data.interviewerId, // Will enrich with user name
                date: data.date,
                time: slot.time,
              });
            }
          }
        }

        if (mounted) {
          setInterviews(myInterviews);
          setAvailableSlots(slots.slice(0, 12));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading interviews:", err);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user]);

  async function bookInterview(slot: AvailableSlot) {
    setBookingSlot(slot);
    setError("");
    setBookingStatus("Booking...");
    try {
      const fn = httpsCallable(functions, "bookMockInterview");
      await fn({
        interviewerId: slot.interviewerId,
        date: slot.date,
        time: slot.time,
      });
      setBookingStatus("Booked! Check your notifications.");
      setAvailableSlots((prev) => prev.filter((s) => !(s.interviewerId === slot.interviewerId && s.date === slot.date && s.time === slot.time)));
    } catch (err: any) {
      setError(err.message || "Booking failed.");
      setBookingStatus("");
    } finally {
      setBookingSlot(null);
    }
  }

  async function handleJoinInterview(interviewId: string) {
    try {
      const fn = httpsCallable(functions, "getInterviewJoinLink");
      const result = await fn({ interviewId }) as { data: { meetingLink: string } };
      window.open(result.data.meetingLink, "_blank");
    } catch (err: any) {
      setError(err.message || "Cannot get join link yet.");
    }
  }

  const upcomingInterviews = interviews.filter((i) => i.status === "scheduled" || i.status === "pending");
  const completedInterviews = interviews.filter((i) => i.status === "completed");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mock Interviews</h1>
          <p className="text-sm text-gray-400 mt-1">Book 1:1 sessions with industry-experienced mentors</p>
        </div>
        <Link href="/dashboard/student/training">
          <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
            Training Hub
          </Button>
        </Link>
      </div>

      {(error || bookingStatus) && (
        <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${error ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"}`}>
          {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {error || bookingStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              My Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Mic className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                No upcoming interviews. Book a slot on the right!
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} onJoin={() => handleJoinInterview(interview.id)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Book a Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Available Slots
            </CardTitle>
            <CardDescription>Next 14 days · 45-minute sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                No slots available in the next 14 days. Check back soon.
              </div>
            ) : (
              <div className="space-y-2">
                {availableSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        <span className="text-white font-semibold">{slot.date}</span>
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span className="text-white">{slot.time} IST</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Mentor Available
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => bookInterview(slot)}
                      disabled={bookingSlot?.date === slot.date && bookingSlot?.time === slot.time}
                    >
                      {bookingSlot?.date === slot.date && bookingSlot?.time === slot.time
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : "Book"
                      }
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Interviews with Feedback */}
      {completedInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed Interviews & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedInterviews.map((interview) => (
              <InterviewFeedbackCard key={interview.id} interview={interview} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InterviewCard({ interview, onJoin }: { interview: MockInterviewDoc; onJoin: () => void }) {
  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-semibold">{interview.scheduledDate}</span>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{interview.scheduledTimeIST} IST</span>
          <span>· {interview.durationMinutes}min</span>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
          interview.status === "scheduled" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"
        }`}>
          {interview.status}
        </span>
      </div>
      <Button variant="primary" size="sm" fullWidth leftIcon={<PlayCircle className="w-3.5 h-3.5" />} onClick={onJoin}>
        Join Interview
      </Button>
    </div>
  );
}

function InterviewFeedbackCard({ interview }: { interview: MockInterviewDoc }) {
  const fb = interview.feedback;

  function RatingBar({ label, value }: { label: string; value: number }) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-28 text-gray-400 shrink-0">{label}</span>
        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${(value / 5) * 100}%` }} />
        </div>
        <span className="w-6 text-right text-white font-bold">{value}/5</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {interview.scheduledDate}</span>
        <span className="flex items-center gap-1 text-amber-400">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="font-bold">{fb?.overall || "N/A"}/5</span> Overall
        </span>
      </div>

      {fb ? (
        <div className="space-y-2">
          <RatingBar label="Communication" value={fb.communication} />
          <RatingBar label="Technical Depth" value={fb.technicalDepth} />
          <RatingBar label="Problem Solving" value={fb.problemSolving} />
          <RatingBar label="Confidence" value={fb.confidence} />
        </div>
      ) : (
        <p className="text-xs text-gray-500">Feedback not yet submitted by interviewer.</p>
      )}

      {fb && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Strengths</p>
            <p className="text-xs text-gray-300">{fb.strengths}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20">
            <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Areas to Improve</p>
            <p className="text-xs text-gray-300">{fb.improvements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
