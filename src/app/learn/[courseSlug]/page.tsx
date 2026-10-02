"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { Loader2, AlertCircle, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function CourseLearnIndexPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const courseSlug = params.courseSlug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function routeToFirstLesson() {
      if (authLoading) return;
      if (!user) {
        router.push(`/login?redirect=/learn/${courseSlug}`);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch course by slug
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("slug", "==", courseSlug));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError("Course not found.");
          setLoading(false);
          return;
        }

        const courseDoc = snap.docs[0];
        const courseId = courseDoc.id;

        // 2. Check enrollment for lastAccessedLessonId
        const enrollmentRef = doc(db, "enrollments", `${user.uid}_${courseId}`);
        const enrollSnap = await getDoc(enrollmentRef);

        if (enrollSnap.exists()) {
          const lastLesson = enrollSnap.data()?.lastAccessedLessonId;
          if (lastLesson) {
            router.replace(`/learn/${courseSlug}/${lastLesson}`);
            return;
          }
        }

        // 3. Fallback: Find first module's first lesson
        const modulesRef = collection(db, "courses", courseId, "modules");
        const modSnap = await getDocs(query(modulesRef, orderBy("order", "asc")));

        if (!modSnap.empty) {
          for (const mDoc of modSnap.docs) {
            const lessonsRef = collection(db, "courses", courseId, "modules", mDoc.id, "lessons");
            const lSnap = await getDocs(query(lessonsRef, orderBy("order", "asc")));
            if (!lSnap.empty) {
              const firstLessonId = lSnap.docs[0].id;
              router.replace(`/learn/${courseSlug}/${firstLessonId}`);
              return;
            }
          }
        }

        setError("This course does not have any lessons published yet.");
        setLoading(false);
      } catch (err: any) {
        console.error("Routing error:", err);
        setError(err.message || "Failed to load course.");
        setLoading(false);
      }
    }

    routeToFirstLesson();
  }, [courseSlug, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm tracking-wide">Initializing learning environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-gray-800 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold mb-2">Curriculum Unavailable</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/courses"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-700 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <Link
            href={`/courses/${courseSlug}`}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Course Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
