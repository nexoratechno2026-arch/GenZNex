"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import type { CourseDoc, ModuleDoc, LessonDoc, LessonNoteDoc } from "@/types/schema";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileText,
  ExternalLink,
  BookOpen,
  Award,
  Bookmark,
  BookmarkCheck,
  Clock,
  Sparkles,
  HelpCircle,
  FolderGit2,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  FileCheck,
} from "lucide-react";

export default function LearningPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const courseSlug = params.courseSlug as string;
  const lessonId = params.lessonId as string;

  // Course & Curriculum State
  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [modules, setModules] = useState<Array<ModuleDoc & { lessons: LessonDoc[] }>>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonDoc | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Enrollment & Progress State
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isCourseOwner, setIsCourseOwner] = useState<boolean>(false);

  // Lesson Delivery & Video State
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(false);
  const [savedPosition, setSavedPosition] = useState<number>(0);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  // Notes & Bookmarks State
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "resources">("overview");
  const [notes, setNotes] = useState<LessonNoteDoc[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // UI Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateSuccess, setCertificateSuccess] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastHeartbeatTimeRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // 1. Initial Load: Fetch Course, Modules, Lessons, and Enrollment
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadCurriculum() {
      if (authLoading) return;
      if (!user) {
        router.push(`/login?redirect=/learn/${courseSlug}/${lessonId}`);
        return;
      }

      try {
        setLoading(true);

        // Fetch course by slug
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("slug", "==", courseSlug));
        const snap = await getDocs(q);

        if (snap.empty) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const courseDoc = snap.docs[0];
        const courseData = { id: courseDoc.id, ...courseDoc.data() } as CourseDoc;
        setCourse(courseData);

        const isOwner =
          courseData.instructor?.uid === user.uid ||
          courseData.trainerId === user.uid ||
          userProfile?.role === "admin";
        setIsCourseOwner(isOwner);

        // Fetch enrollment
        const enrollDoc = await getDoc(doc(db, "enrollments", `${user.uid}_${courseData.id}`));
        const enrolled = enrollDoc.exists() && enrollDoc.data()?.status === "active";
        setIsEnrolled(enrolled || isOwner);

        if (enrollDoc.exists()) {
          const eData = enrollDoc.data();
          setEnrollment(eData);
          setProgressPercent(eData.progressPercentage || 0);
          setCompletedLessonIds(new Set(eData.completedLessons || []));
        }

        // Fetch Modules & Lessons
        const modulesRef = collection(db, "courses", courseData.id, "modules");
        const modulesSnap = await getDocs(query(modulesRef, orderBy("order", "asc")));

        const loadedModules: Array<ModuleDoc & { lessons: LessonDoc[] }> = [];
        let targetLesson: LessonDoc | null = null;

        for (const mDoc of modulesSnap.docs) {
          const mData = { id: mDoc.id, ...mDoc.data() } as ModuleDoc;
          const lessonsRef = collection(db, "courses", courseData.id, "modules", mDoc.id, "lessons");
          const lSnap = await getDocs(query(lessonsRef, orderBy("order", "asc")));
          const lessons: LessonDoc[] = [];

          lSnap.forEach((lDoc) => {
            const lData = { id: lDoc.id, ...lDoc.data() } as LessonDoc;
            lessons.push(lData);
            if (lData.id === lessonId) {
              targetLesson = lData;
            }
          });

          loadedModules.push({ ...mData, lessons });
        }

        setModules(loadedModules);
        setCurrentLesson(targetLesson);

        // Fetch Quizzes on course
        const quizzesSnap = await getDocs(collection(db, "courses", courseData.id, "quizzes"));
        setQuizzes(quizzesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Fetch Assignments on course
        const assignmentsSnap = await getDocs(collection(db, "courses", courseData.id, "assignments"));
        setAssignments(assignmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // 2. Fetch Lesson Access via Cloud Function
        if (targetLesson) {
          const getLessonAccessFn = httpsCallable(functions, "getLessonAccess");
          const lesson = targetLesson as any;
          const accessRes: any = await getLessonAccessFn({
            courseId: courseData.id,
            lessonId: lesson.id,
          });

          if (accessRes.data?.accessGranted) {
            if (accessRes.data.playback?.playbackUrl) {
              setPlaybackUrl(accessRes.data.playback.playbackUrl);
              setVideoToken(accessRes.data.playback.token || null);
            }
          }
        }

        // 3. Check saved position from subcollection
        if (enrolled) {
          const progDoc = await getDoc(
            doc(db, "enrollments", `${user.uid}_${courseData.id}`, "lesson_progress", lessonId)
          );
          if (progDoc.exists()) {
            const pData = progDoc.data();
            if (pData.positionSeconds && pData.positionSeconds > 10 && !pData.completed) {
              setSavedPosition(pData.positionSeconds);
              setShowResumeBanner(true);
            }
          }

          // Check Bookmark
          const bmDoc = await getDoc(
            doc(db, "enrollments", `${user.uid}_${courseData.id}`, "bookmarks", lessonId)
          );
          setIsBookmarked(bmDoc.exists());
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error loading lesson:", err);
        if (err.code === "functions/permission-denied" || err.message?.includes("Active enrollment required")) {
          setAccessDenied(true);
        }
        setLoading(false);
      }
    }

    loadCurriculum();
  }, [courseSlug, lessonId, user, authLoading, router, userProfile?.role]);

  // ---------------------------------------------------------------------------
  // 2. Real-time Notes Listener for Current Lesson
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user || !course) return;
    const notesRef = collection(db, "enrollments", `${user.uid}_${course.id}`, "notes");
    const q = query(notesRef, where("lessonId", "==", lessonId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: LessonNoteDoc[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as LessonNoteDoc));
        loaded.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
        setNotes(loaded);
      },
      (err) => {
        console.warn("Notes onSnapshot notice:", err.message);
      }
    );

    return () => unsubscribe();
  }, [user, course, lessonId]);

  // ---------------------------------------------------------------------------
  // 3. Server Progress Reporting (Debounced Heartbeat & Flushes)
  // ---------------------------------------------------------------------------
  const syncProgressToServer = useCallback(
    async (posSec: number, durSec: number, markComplete: boolean = false) => {
      if (!user || !course || !isEnrolled) return;
      try {
        const updateProgressFn = httpsCallable(functions, "updateLessonProgress");
        const res: any = await updateProgressFn({
          courseId: course.id,
          lessonId,
          positionSeconds: Math.floor(posSec),
          durationSeconds: Math.floor(durSec),
          completed: markComplete,
        });

        if (res.data?.success) {
          setProgressPercent(res.data.progressPercentage);
          if (res.data.completed) {
            setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
          }
        }
      } catch (err) {
        console.warn("Progress update sync warning:", err);
      }
    },
    [user, course, lessonId, isEnrolled]
  );

  // Heartbeat every 15 seconds during active playback
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);

    // Watch threshold check: 90%
    if (dur > 0 && curr >= dur * 0.9 && !completedLessonIds.has(lessonId)) {
      setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
      syncProgressToServer(curr, dur, true);
    }

    // 15-second debounced heartbeat
    const now = Date.now();
    if (now - lastHeartbeatTimeRef.current >= 15000) {
      lastHeartbeatTimeRef.current = now;
      syncProgressToServer(curr, dur, false);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      syncProgressToServer(videoRef.current.currentTime, videoRef.current.duration || 0, false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      syncProgressToServer(videoRef.current.duration, videoRef.current.duration, true);
    }

    // Start 5-second countdown to auto-advance to next lesson
    const next = getNextLesson();
    if (next) {
      setAutoAdvanceTimer(5);
    }
  };

  // Auto-advance countdown effect
  useEffect(() => {
    if (autoAdvanceTimer === null) return;
    if (autoAdvanceTimer <= 0) {
      const next = getNextLesson();
      if (next) {
        setAutoAdvanceTimer(null);
        router.push(`/learn/${courseSlug}/${next.id}`);
      }
      return;
    }

    const timer = setTimeout(() => {
      setAutoAdvanceTimer((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceTimer, courseSlug, router]);

  // Flush on page exit / unload
  useEffect(() => {
    const handleUnload = () => {
      if (videoRef.current) {
        syncProgressToServer(videoRef.current.currentTime, videoRef.current.duration || 0, false);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [syncProgressToServer]);

  // ---------------------------------------------------------------------------
  // 4. Keyboard Shortcuts: Space (Play/Pause), Left/Right (Seek 5s), M (Mute), F (Fullscreen)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in notes input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (!videoRef.current) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration || 0,
          videoRef.current.currentTime + 5
        );
      } else if (e.code === "KeyM") {
        e.preventDefault();
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      } else if (e.code === "KeyF") {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          videoRef.current.requestFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // 5. Navigation Helpers: Previous / Next Lesson
  // ---------------------------------------------------------------------------
  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);

  const getPreviousLesson = () => (currentIndex > 0 ? allLessons[currentIndex - 1] : null);
  const getNextLesson = () => (currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ---------------------------------------------------------------------------
  // 6. Action Handlers: Notes, Bookmark, Manual Complete, Issue Certificate
  // ---------------------------------------------------------------------------
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !user || !course) return;

    try {
      const noteSec = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
      const notesRef = collection(db, "enrollments", `${user.uid}_${course.id}`, "notes");
      await setDoc(doc(notesRef), {
        userId: user.uid,
        courseId: course.id,
        lessonId,
        timestampSeconds: noteSec,
        noteText: newNoteText.trim(),
        createdAt: serverTimestamp(),
      });
      setNewNoteText("");
    } catch (err) {
      console.error("Add note failed:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !course) return;
    try {
      await deleteDoc(doc(db, "enrollments", `${user.uid}_${course.id}`, "notes", noteId));
    } catch (err) {
      console.error("Delete note failed:", err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !course) return;
    const bmRef = doc(db, "enrollments", `${user.uid}_${course.id}`, "bookmarks", lessonId);
    if (isBookmarked) {
      await deleteDoc(bmRef);
      setIsBookmarked(false);
    } else {
      await setDoc(bmRef, {
        lessonId,
        bookmarkedAt: serverTimestamp(),
      });
      setIsBookmarked(true);
    }
  };

  const handleManualComplete = () => {
    setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
    syncProgressToServer(0, 0, true);
  };

  const handleClaimCertificate = async () => {
    if (!course) return;
    try {
      setCertificateLoading(true);
      const issueCertFn = httpsCallable(functions, "issueCertificate");
      const res: any = await issueCertFn({ courseId: course.id });
      setCertificateSuccess(res.data);
      setCertificateLoading(false);
    } catch (err: any) {
      console.error("Certificate claim failed:", err);
      alert(err.message || "Failed to issue certificate.");
      setCertificateLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. Render Loading & Access Denied states
  // ---------------------------------------------------------------------------
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading secure curriculum video stream...</p>
      </div>
    );
  }

  if (accessDenied || (!isEnrolled && !currentLesson?.isPreview)) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-gray-800 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Enrollment Required</h2>
          <p className="text-sm text-gray-400 mb-6">
            This lesson is exclusive to enrolled students. Enroll now to unlock full HD video lessons, projects, quizzes, and your verified certificate.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/checkout/${courseSlug}`}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-sm tracking-wide transition shadow-lg shadow-purple-600/25"
            >
              Enroll Now to Access
            </Link>
            <Link
              href={`/courses/${courseSlug}`}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              View Course Syllabus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col">
      {/* ----------------------------------------------------------------------- */}
      {/* Top Navbar */}
      {/* ----------------------------------------------------------------------- */}
      <header className="h-14 border-b border-gray-800/80 bg-[#0d0f1a]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white transition"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="overflow-hidden">
            <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold block">
              {course?.title || "GenZNex Course"}
            </span>
            <h1 className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
              {currentLesson?.title || "Lesson"}
            </h1>
          </div>
        </div>

        {/* Course Progress & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-gray-300">{progressPercent}%</span>
          </div>

          {progressPercent >= 100 && (
            <button
              onClick={handleClaimCertificate}
              disabled={certificateLoading}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 transition"
            >
              {certificateLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Award className="w-3.5 h-3.5" />
              )}
              Claim Certificate
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition lg:hidden"
            title="Toggle Curriculum Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* Main Learning Grid */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Resume from last position banner */}
          {showResumeBanner && (
            <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-purple-200">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span>
                  You previously watched up to <strong>{formatTime(savedPosition)}</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = savedPosition;
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                    setShowResumeBanner(false);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
                >
                  Resume
                </button>
                <button
                  onClick={() => setShowResumeBanner(false)}
                  className="text-gray-400 hover:text-white px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Auto-advance notification */}
          {autoAdvanceTimer !== null && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-500/50 flex items-center justify-between text-sm shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center font-bold text-purple-300">
                  {autoAdvanceTimer}
                </div>
                <span>
                  Next lesson starting automatically in {autoAdvanceTimer}s...
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoAdvanceTimer(null)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const next = getNextLesson();
                    if (next) router.push(`/learn/${courseSlug}/${next.id}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
                >
                  Play Now
                </button>
              </div>
            </div>
          )}

          {/* 1. LESSON VIEWER CONTAINER */}
          <div className="w-full bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative group">
            {currentLesson?.type === "video" ? (
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={playbackUrl || undefined}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => {
                    if (videoRef.current?.paused) {
                      videoRef.current.play();
                      setIsPlaying(true);
                    } else {
                      videoRef.current?.pause();
                      setIsPlaying(false);
                    }
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handlePause}
                  onPlay={() => setIsPlaying(true)}
                  onEnded={handleEnded}
                />

                {/* Custom Video Controls Bar */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2">
                  {/* Seek Bar */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />

                  {/* Buttons Row */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (videoRef.current?.paused) {
                            videoRef.current.play();
                            setIsPlaying(true);
                          } else {
                            videoRef.current?.pause();
                            setIsPlaying(false);
                          }
                        }}
                        className="p-1 hover:text-purple-400 transition"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.muted = !videoRef.current.muted;
                              setIsMuted(videoRef.current.muted);
                            }
                          }}
                          className="hover:text-purple-400"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVolume(val);
                            if (videoRef.current) {
                              videoRef.current.volume = val;
                              videoRef.current.muted = val === 0;
                              setIsMuted(val === 0);
                            }
                          }}
                          className="w-16 h-1 bg-gray-600 rounded appearance-none accent-purple-500 cursor-pointer"
                        />
                      </div>

                      <span className="font-mono text-[11px] text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Playback speed selector */}
                      <select
                        value={playbackSpeed}
                        onChange={(e) => {
                          const speed = Number(e.target.value);
                          setPlaybackSpeed(speed);
                          if (videoRef.current) videoRef.current.playbackRate = speed;
                        }}
                        className="bg-black/60 border border-gray-700 text-[11px] font-mono rounded px-1.5 py-0.5 text-gray-200"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1.0x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2.0x</option>
                      </select>

                      {/* Fullscreen */}
                      <button
                        onClick={() => {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            videoRef.current?.requestFullscreen();
                          }
                        }}
                        className="hover:text-purple-400 transition"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentLesson?.type === "pdf" ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[420px] text-center space-y-4">
                <FileText className="w-16 h-16 text-purple-400" />
                <h3 className="text-lg font-bold">PDF Lesson Material</h3>
                <p className="text-sm text-gray-400 max-w-md">
                  Download or open the PDF reference notes and slide decks for this lesson.
                </p>
                <div className="flex gap-3">
                  <a
                    href={currentLesson.pdfUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open PDF Document
                  </a>
                  {!completedLessonIds.has(lessonId) && (
                    <button
                      onClick={handleManualComplete}
                      className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ) : currentLesson?.type === "link" ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[420px] text-center space-y-4">
                <ExternalLink className="w-16 h-16 text-cyan-400" />
                <h3 className="text-lg font-bold">External Resource & Code Repository</h3>
                <p className="text-sm text-gray-400 max-w-md">
                  This lesson links to an external interactive sandbox or open-source GitHub starter code.
                </p>
                <div className="flex gap-3">
                  <a
                    href={currentLesson.externalLink || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open External Link
                  </a>
                  {!completedLessonIds.has(lessonId) && (
                    <button
                      onClick={handleManualComplete}
                      className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Text / Markdown Lesson */
              <div className="p-8 space-y-6 min-h-[400px]">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase font-bold">
                    <BookOpen className="w-4 h-4" /> Reading Lesson
                  </div>
                  {!completedLessonIds.has(lessonId) && (
                    <button
                      onClick={handleManualComplete}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Read
                    </button>
                  )}
                </div>
                <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-4">
                  {currentLesson?.textContent ? (
                    <p className="whitespace-pre-wrap">{currentLesson.textContent}</p>
                  ) : (
                    <p>No text content provided for this lesson.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Actions & Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                  {currentLesson?.type.toUpperCase()} LESSON
                </span>
                {completedLessonIds.has(lessonId) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{currentLesson?.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleBookmark}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isBookmarked
                    ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                    : "bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white"
                }`}
                title="Bookmark Lesson"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-purple-400" /> Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" /> Bookmark
                  </>
                )}
              </button>

              {getPreviousLesson() && (
                <Link
                  href={`/learn/${courseSlug}/${getPreviousLesson()?.id}`}
                  className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
              )}

              {getNextLesson() && (
                <Link
                  href={`/learn/${courseSlug}/${getNextLesson()?.id}`}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. TABS: Overview, Notes, Resources */}
          <div className="space-y-4">
            <div className="flex gap-4 border-b border-gray-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2 transition ${
                  activeTab === "overview"
                    ? "text-purple-400 border-b-2 border-purple-500 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`pb-2 transition flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "text-purple-400 border-b-2 border-purple-500 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Personal Notes ({notes.length})
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="space-y-4 text-sm text-gray-300">
                <p>
                  Estimated duration: <strong>{currentLesson?.durationMinutes} mins</strong>. Follow along
                  hands-on in your local code editor.
                </p>
                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 shrink-0">
                    {course?.instructor?.name?.[0] || "T"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {course?.instructor?.name || "Instructor"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {course?.instructor?.headline || "Senior Tech Architect"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={`Take note at ${formatTime(currentTime)}...`}
                    className="flex-1 px-4 py-2 text-xs bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Note
                  </button>
                </form>

                {notes.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">
                    No notes taken yet. Pause the video and write key takeaways with timestamps.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = n.timestampSeconds;
                                videoRef.current.play();
                                setIsPlaying(true);
                              }
                            }}
                            className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center gap-1 transition"
                            title="Jump to video timestamp"
                          >
                            <Clock className="w-3 h-3" /> {formatTime(n.timestampSeconds)}
                          </button>
                          <span className="text-gray-300">{n.noteText}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-gray-500 hover:text-red-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* --------------------------------------------------------------------- */}
        {/* Right Sidebar: Curriculum Drawer */}
        {/* --------------------------------------------------------------------- */}
        <aside
          className={`fixed inset-y-14 right-0 z-30 w-80 bg-[#0d0f1a] border-l border-gray-800 flex flex-col justify-between transition-transform duration-300 lg:static ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Course Curriculum
            </h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {modules.map((m, mIdx) => (
              <div key={m.id} className="space-y-1.5">
                <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                  <span>
                    Module {mIdx + 1}: {m.title}
                  </span>
                  <span>{m.lessons.length} Lessons</span>
                </div>

                <div className="space-y-1">
                  {m.lessons.map((l) => {
                    const isCurrent = l.id === lessonId;
                    const isDone = completedLessonIds.has(l.id);

                    return (
                      <Link
                        key={l.id}
                        href={`/learn/${courseSlug}/${l.id}`}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isCurrent
                            ? "bg-purple-600/20 border border-purple-500/40 text-purple-300 font-semibold"
                            : "hover:bg-gray-800/60 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <Play className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span className="truncate">{l.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0 ml-2">
                          {l.durationMinutes}m
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quizzes Section */}
            {quizzes.length > 0 && (
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <div className="px-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Course Quizzes
                </div>
                {quizzes.map((q) => (
                  <Link
                    key={q.id}
                    href={`/learn/${courseSlug}/quiz/${q.id}`}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="truncate">{q.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-bold">
                      {q.passingScore}% to pass
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Assignments Section */}
            {assignments.length > 0 && (
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <div className="px-2 text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" /> Hands-On Projects
                </div>
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/learn/${courseSlug}/assignment/${a.id}`}
                    className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="truncate">{a.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 font-bold">
                      {a.maxPoints} pts
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* Certificate Claim Success Modal */}
      {/* ----------------------------------------------------------------------- */}
      {certificateSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-amber-500/40 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Congratulations, Achiever!</h3>
            <p className="text-xs text-gray-300">
              You have successfully completed 100% of <strong>{course?.title}</strong> and your official verified certificate has been issued!
            </p>
            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 font-mono text-xs text-purple-300">
              ID: {certificateSuccess.certificateId}
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Link
                href={`/verify/${certificateSuccess.certificateId}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Verify Online
              </Link>
              <Link
                href="/student/certificates"
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
              >
                View in Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
