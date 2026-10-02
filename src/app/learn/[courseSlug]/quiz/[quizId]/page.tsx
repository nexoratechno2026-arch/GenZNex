"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { httpsCallable } from "firebase/functions";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Loader2,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const courseSlug = params.courseSlug as string;
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Student Responses: questionId -> value
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    isTimedOut?: boolean;
    passingScore: number;
  } | null>(null);

  // 1. Fetch Course and Call `startQuizAttempt`
  useEffect(() => {
    async function initQuiz() {
      if (authLoading) return;
      if (!user) {
        router.push(`/login?redirect=/learn/${courseSlug}/quiz/${quizId}`);
        return;
      }

      try {
        setLoading(true);
        // Fetch course by slug
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("slug", "==", courseSlug));
        const snap = await getDocs(q);

        if (snap.empty) {
          alert("Course not found");
          router.push("/courses");
          return;
        }

        const cId = snap.docs[0].id;
        setCourseId(cId);

        // Start Quiz Attempt via Cloud Function
        const startAttemptFn = httpsCallable(functions, "startQuizAttempt");
        const res: any = await startAttemptFn({ courseId: cId, quizId });

        if (res.data) {
          setAttemptId(res.data.attemptId);
          setQuizTitle(res.data.quizTitle);
          setQuestions(res.data.questions || []);
          setPassingScore(res.data.passingScore || 70);
          setTimeLimitMinutes(res.data.timeLimitMinutes || 0);

          if (res.data.timeLimitMinutes && res.data.timeLimitMinutes > 0) {
            setRemainingSeconds(res.data.timeLimitMinutes * 60);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Start quiz failed:", err);
        alert(err.message || "Failed to start quiz attempt.");
        router.push(`/learn/${courseSlug}`);
        setLoading(false);
      }
    }

    initQuiz();
  }, [courseSlug, quizId, user, authLoading, router]);

  // 2. Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || quizResult !== null) return;
    if (remainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, quizResult]);

  // 3. Response change helper
  const handleSelectAnswer = (qId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [qId]: value,
    }));
  };

  const handleToggleMulti = (qId: string, optionIdx: number) => {
    const existing: number[] = Array.isArray(responses[qId]) ? responses[qId] : [];
    if (existing.includes(optionIdx)) {
      setResponses((prev) => ({
        ...prev,
        [qId]: existing.filter((i) => i !== optionIdx),
      }));
    } else {
      setResponses((prev) => ({
        ...prev,
        [qId]: [...existing, optionIdx].sort(),
      }));
    }
  };

  // 4. Submit Quiz
  const handleFinalSubmit = async (autoTimedOut: boolean = false) => {
    if (!attemptId) return;
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const submitAttemptFn = httpsCallable(functions, "submitQuizAttempt");
      const res: any = await submitAttemptFn({
        attemptId,
        responses,
      });

      setQuizResult(res.data);
      setSubmitting(false);
    } catch (err: any) {
      console.error("Submit quiz failed:", err);
      alert(err.message || "Failed to submit quiz.");
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Preparing exam environment...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Results Screen
  // ---------------------------------------------------------------------------
  if (quizResult) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full glass-panel p-8 rounded-2xl border border-gray-800 text-center space-y-6">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              quizResult.passed
                ? "bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-2 border-red-500/30 text-red-400"
            }`}
          >
            {quizResult.passed ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <XCircle className="w-10 h-10" />
            )}
          </div>

          <div>
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                quizResult.passed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {quizResult.passed ? "Examination Passed" : "Passing Threshold Not Met"}
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">{quizTitle}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Passing requirement: {quizResult.passingScore}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <div>
              <div className="text-xs text-gray-400">Your Score</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {quizResult.score} / {quizResult.totalPoints}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Percentage</div>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  quizResult.passed ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {quizResult.percentage}%
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            {!quizResult.passed && (
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
            )}
            <Link
              href={`/learn/${courseSlug}`}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-purple-600/20"
            >
              Continue Learning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Active Question Examination Screen
  // ---------------------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-800 bg-[#0d0f1a] px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/${courseSlug}`}
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
              QUIZ ASSESSMENT
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {quizTitle}
            </h1>
          </div>
        </div>

        {/* Timer & Submit CTA */}
        <div className="flex items-center gap-4">
          {remainingSeconds !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
                remainingSeconds < 120
                  ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse"
                  : "bg-gray-800/60 border-gray-700 text-gray-300"
              }`}
            >
              <Clock className="w-4 h-4" /> {formatTimer(remainingSeconds)}
            </div>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
          >
            Submit Quiz
          </button>
        </div>
      </header>

      {/* Main Examination Room */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6">
        {/* Progress & Question Navigator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Question <strong>{currentIndex + 1}</strong> of {questions.length}
            </span>
            <span>
              {answeredCount} of {questions.length} Answered
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {questions.map((q, idx) => {
              const isAnswered = responses[q.id] !== undefined && responses[q.id] !== "";
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : isAnswered
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800/80 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                {currentQ.type.replace("_", " ").toUpperCase()} • {currentQ.points} PTS
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.text}
            </h3>

            {/* Question Inputs */}
            {currentQ.type === "mcq_single" && (
              <div className="space-y-2.5">
                {(currentQ.options || []).map((opt: string, optIdx: number) => {
                  const isSelected = responses[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                      className={`w-full p-4 rounded-xl text-left text-sm flex items-center justify-between border transition ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-purple-200 font-semibold"
                          : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-purple-400 bg-purple-500 text-white" : "border-gray-600"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "mcq_multi" && (
              <div className="space-y-2.5">
                <p className="text-xs text-purple-300 italic">Select all options that apply:</p>
                {(currentQ.options || []).map((opt: string, optIdx: number) => {
                  const selectedIndices: number[] = Array.isArray(responses[currentQ.id])
                    ? responses[currentQ.id]
                    : [];
                  const isSelected = selectedIndices.includes(optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleToggleMulti(currentQ.id, optIdx)}
                      className={`w-full p-4 rounded-xl text-left text-sm flex items-center justify-between border transition ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-purple-200 font-semibold"
                          : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected ? "border-purple-400 bg-purple-500 text-white" : "border-gray-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "true_false" && (
              <div className="grid grid-cols-2 gap-4">
                {[true, false].map((val) => {
                  const isSelected = responses[currentQ.id] === val;
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQ.id, val)}
                      className={`py-6 rounded-xl font-bold text-center border transition ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-purple-300"
                          : "bg-gray-900/60 border-gray-800 text-gray-400 hover:bg-gray-800/60"
                      }`}
                    >
                      {val ? "TRUE" : "FALSE"}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "short_answer" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={responses[currentQ.id] || ""}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 bg-gray-900/80 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg"
            >
              Review & Submit
            </button>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-gray-800 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Ready to Submit Exam?</h3>
            <p className="text-xs text-gray-300">
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              Once submitted, your answers will be graded server-side and recorded.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
              >
                Back to Exam
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
