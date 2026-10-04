"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  Plus,
  Trash2,
  PlayCircle,
  FileText,
  Link as LinkIcon,
  Video,
  AlertCircle,
  Eye,
  ArrowLeft,
  Upload,
  X,
  Tag,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { doc, setDoc, getDoc, collection, getDocs, addDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { 
  CourseDoc, 
  ModuleDoc, 
  LessonDoc, 
  CourseLevel, 
  CourseLanguage, 
  LessonType,
  CategoryDoc 
} from "@/types/schema";
import { getCategories } from "@/lib/services/courseSearch";
import { CourseCard } from "@/components/courses/CourseCard";

interface CourseWizardProps {
  initialCourseId?: string;
}

export function CourseWizard({ initialCourseId }: CourseWizardProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [courseId, setCourseId] = useState<string>(
    initialCourseId || `course_${Date.now()}`
  );
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Lesson expand/collapse
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("web-development");
  const [categoryName, setCategoryName] = useState("Web Development");
  const [level, setLevel] = useState<CourseLevel>("beginner");
  const [language, setLanguage] = useState<CourseLanguage>("English");
  const [tagsInput, setTagsInput] = useState("Next.js, React, WebDev");

  // Pricing State
  const [isFree, setIsFree] = useState(false);
  const [priceInInr, setPriceInInr] = useState("1999");
  const [discountInInr, setDiscountInInr] = useState("999");

  // Media & Metadata
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop");
  const [promoVideoUrl, setPromoVideoUrl] = useState("");
  const [outcomes, setOutcomes] = useState<string[]>([
    "Build full-stack applications from scratch",
    "Deploy scalable services to the cloud",
  ]);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([
    "Basic understanding of programming",
    "Computer with internet connection",
  ]);
  const [requirementInput, setRequirementInput] = useState("");

  // Curriculum State
  interface LocalLesson {
    id: string;
    title: string;
    order: number;
    type: LessonType;
    durationMinutes: number;
    isPreview: boolean;
    videoId?: string;
    videoProvider?: "mux" | "bunny" | "vimeo" | "youtube" | "googledrive";
    pdfUrl?: string;
    externalLink?: string;
  }

  interface LocalModule {
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: LocalLesson[];
  }

  const [modules, setModules] = useState<LocalModule[]>([
    {
      id: "mod_1",
      title: "Module 1: Getting Started & Foundations",
      description: "Core conceptual walkthroughs and setup",
      order: 1,
      lessons: [
        {
          id: "les_1_1",
          title: "Course Overview & Learning Objectives",
          order: 1,
          type: "video",
          durationMinutes: 15,
          isPreview: true,
          videoId: "intro_01",
          videoProvider: "youtube",
        },
      ],
    },
  ]);

  // Load existing course if editing
  useEffect(() => {
    async function loadData() {
      try {
        const cats = await getCategories();
        setCategories(cats);

        if (initialCourseId) {
          const docRef = doc(db, "courses", initialCourseId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as CourseDoc;
            setTitle(data.title || "");
            setSlug(data.slug || "");
            setSubtitle(data.subtitle || "");
            setDescription(data.description || "");
            setCategory(data.category || "web-development");
            setCategoryName(data.categoryName || "Web Development");
            setLevel(data.level || "beginner");
            setLanguage(data.language || "English");
            setTagsInput(data.tags ? data.tags.join(", ") : "");
            setIsFree(data.priceInPaise === 0);
            setPriceInInr(data.priceInPaise ? String(Math.floor(data.priceInPaise / 100)) : "0");
            setDiscountInInr(data.discountPriceInPaise ? String(Math.floor(data.discountPriceInPaise / 100)) : "");
            setThumbnailUrl(data.thumbnailUrl || "");
            setPromoVideoUrl(data.promoVideoUrl || "");
            if (data.learningOutcomes) setOutcomes(data.learningOutcomes);
            if (data.requirements) setRequirements(data.requirements);

            // Fetch curriculum
            const modsCol = collection(db, "courses", initialCourseId, "modules");
            const modSnaps = await getDocs(modsCol);
            const loadedMods: LocalModule[] = [];

            for (const mSnap of modSnaps.docs) {
              const mData = mSnap.data();
              const lesCol = collection(db, "courses", initialCourseId, "modules", mSnap.id, "lessons");
              const lesSnaps = await getDocs(lesCol);
              const loadedLessons: LocalLesson[] = lesSnaps.docs.map((lSnap) => {
                const lData = lSnap.data();
                return {
                  id: lSnap.id,
                  title: lData.title,
                  order: lData.order,
                  type: lData.type,
                  durationMinutes: lData.durationMinutes || 15,
                  isPreview: Boolean(lData.isPreview),
                  videoId: lData.videoMetadata?.videoId,
                  videoProvider: lData.videoMetadata?.provider,
                  pdfUrl: lData.pdfUrl,
                  externalLink: lData.externalLink,
                };
              });

              loadedMods.push({
                id: mSnap.id,
                title: mData.title,
                description: mData.description || "",
                order: mData.order || 1,
                lessons: loadedLessons.sort((a, b) => a.order - b.order),
              });
            }

            if (loadedMods.length > 0) {
              setModules(loadedMods.sort((a, b) => a.order - b.order));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load course for editing:", err);
      }
    }

    loadData();
  }, [initialCourseId]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialCourseId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  // Autosave to Firestore draft
  const saveDraft = async () => {
    if (!user) return;
    setSaving(true);
    setStatusMessage(null);

    const priceInPaise = isFree ? 0 : (parseInt(priceInInr, 10) || 0) * 100;
    const discountPriceInPaise = discountInInr ? (parseInt(discountInInr, 10) || 0) * 100 : undefined;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    // Calculate lesson count & duration
    let totalLessons = 0;
    let totalDuration = 0;
    modules.forEach((m) => {
      totalLessons += m.lessons.length;
      m.lessons.forEach((l) => (totalDuration += l.durationMinutes || 0));
    });

    try {
      const courseDocRef = doc(db, "courses", courseId);
      await setDoc(
        courseDocRef,
        {
          id: courseId,
          title: title || "Untitled Course",
          slug: slug || `course-${courseId}`,
          subtitle: subtitle || "",
          description: description || "",
          category: category,
          categoryName: categoryName,
          tags: tags,
          level: level,
          language: language,
          priceInPaise: priceInPaise,
          discountPriceInPaise: discountPriceInPaise,
          thumbnailUrl: thumbnailUrl,
          promoVideoUrl: promoVideoUrl,
          learningOutcomes: outcomes,
          requirements: requirements,
          trainerId: user.uid,
          instructor: {
            uid: user.uid,
            name: userProfile?.displayName || user.displayName || "Trainer",
            headline: userProfile?.headline || "Senior Platform Educator",
            photoURL: userProfile?.photoURL || user.photoURL || "",
          },
          status: "draft",
          isPublished: false,
          enrollmentCount: 0,
          rating: 5.0,
          ratingCount: 0,
          isFeatured: false,
          lessonCount: totalLessons,
          totalDurationMinutes: totalDuration,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save modules and lessons
      for (const mod of modules) {
        const modRef = doc(db, "courses", courseId, "modules", mod.id);
        await setDoc(modRef, {
          id: mod.id,
          title: mod.title,
          description: mod.description,
          order: mod.order,
          lessonCount: mod.lessons.length,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        for (const les of mod.lessons) {
          const lesRef = doc(db, "courses", courseId, "modules", mod.id, "lessons", les.id);
          await setDoc(lesRef, {
            id: les.id,
            moduleId: mod.id,
            courseId: courseId,
            title: les.title,
            order: les.order,
            type: les.type,
            durationMinutes: les.durationMinutes,
            isPreview: les.isPreview,
            videoMetadata: les.type === "video" ? {
              provider: les.videoProvider || "youtube",
              videoId: (les.videoId && les.videoId !== "intro_vid" && les.videoId !== "demo_vid" && les.videoId.trim() !== "")
                ? les.videoId.trim()
                : (promoVideoUrl || "dQw4w9WgXcQ"),
              durationSeconds: (les.durationMinutes || 10) * 60,
            } : undefined,
            pdfUrl: les.pdfUrl || "",
            externalLink: les.externalLink || "",
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      setLastSaved(new Date().toLocaleTimeString());
      setStatusMessage({ type: "success", text: "Course draft autosaved successfully!" });
    } catch (err: any) {
      console.error("Autosave failed:", err);
      setStatusMessage({ type: "error", text: "Failed to autosave: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    // Save draft first
    await saveDraft();

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const submitFn = httpsCallable(functions, "submitCourseForReview");
      await submitFn({ courseId });
      setStatusMessage({
        type: "success",
        text: "Course submitted for admin review successfully! Redirecting to studio...",
      });
      setTimeout(() => {
        router.push("/trainer/courses");
      }, 1500);
    } catch (err: any) {
      console.error("Submit for review failed:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to submit course for review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add new category handler
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const newCat: Omit<CategoryDoc, "id"> = {
        name: newCategoryName.trim(),
        slug,
        description: newCategoryDesc.trim() || `Courses in ${newCategoryName.trim()}`,
        courseCount: 0,
        isActive: true,
      } as any;
      const ref = await addDoc(collection(db, "categories"), newCat);
      const catWithId: CategoryDoc = { ...newCat, id: ref.id } as CategoryDoc;
      setCategories((prev) => [...prev, catWithId]);
      setCategory(slug);
      setCategoryName(newCategoryName.trim());
      setNewCategoryName("");
      setNewCategoryDesc("");
      setShowAddCategory(false);
    } catch (err: any) {
      console.error("Failed to create category:", err);
    } finally {
      setSavingCategory(false);
    }
  };

  // Toggle lesson expand
  const toggleLesson = (lesId: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lesId)) next.delete(lesId);
      else next.add(lesId);
      return next;
    });
  };

  // Module & Lesson Handlers
  const addModule = () => {
    const newModOrder = modules.length + 1;
    const newModId = `mod_${newModOrder}_${Date.now()}`;
    setModules([
      ...modules,
      {
        id: newModId,
        title: `Module ${newModOrder}: New Module Title`,
        description: "",
        order: newModOrder,
        lessons: [
          {
            id: `les_${newModOrder}_1_${Date.now()}`,
            title: "Lesson 1: Introduction",
            order: 1,
            type: "video",
            durationMinutes: 15,
            isPreview: true,
            videoId: "intro_vid",
            videoProvider: "youtube",
          },
        ],
      },
    ]);
  };

  const deleteModule = (modId: string) => {
    setModules(modules.filter((m) => m.id !== modId));
  };

  const addLesson = (modId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === modId) {
          const newOrder = m.lessons.length + 1;
          return {
            ...m,
            lessons: [
              ...m.lessons,
              {
                id: `les_${m.order}_${newOrder}_${Date.now()}`,
                title: `Lesson ${newOrder}: New Lesson`,
                order: newOrder,
                type: "video",
                durationMinutes: 20,
                isPreview: false,
                videoId: "vid_demo",
                videoProvider: "youtube",
              },
            ],
          };
        }
        return m;
      })
    );
  };

  const deleteLesson = (modId: string, lesId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === modId) {
          return {
            ...m,
            lessons: m.lessons.filter((l) => l.id !== lesId),
          };
        }
        return m;
      })
    );
  };

  // Preview Course Mock
  const previewCourse: CourseDoc = {
    id: courseId,
    title: title || "Your Course Title",
    slug: slug || "preview-slug",
    subtitle: subtitle || "Course subtitle preview",
    description: description || "Course description preview",
    category: category,
    categoryName: categoryName,
    tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    level: level,
    language: language,
    priceInPaise: isFree ? 0 : (parseInt(priceInInr, 10) || 0) * 100,
    discountPriceInPaise: discountInInr ? (parseInt(discountInInr, 10) || 0) * 100 : undefined,
    thumbnailUrl: thumbnailUrl,
    promoVideoUrl: promoVideoUrl,
    learningOutcomes: outcomes,
    requirements: requirements,
    instructor: {
      uid: user?.uid || "trainer_01",
      name: userProfile?.displayName || user?.displayName || "Trainer Name",
      headline: userProfile?.headline || "Senior Platform Educator",
      photoURL: userProfile?.photoURL || user?.photoURL || "",
    },
    status: "draft",
    rating: 5.0,
    ratingCount: 0,
    enrollmentCount: 0,
    isFeatured: false,
    lessonCount: modules.reduce((acc, m) => acc + m.lessons.length, 0),
    totalDurationMinutes: modules.reduce((acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.durationMinutes, 0), 0),
  };

  const steps = [
    { num: 1, label: "Basics" },
    { num: 2, label: "Pricing" },
    { num: 3, label: "Curriculum" },
    { num: 4, label: "Media & Details" },
    { num: 5, label: "Review & Submit" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Autosave Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/trainer/courses")}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Course Studio Wizard</h1>
            <p className="text-xs text-zinc-400">
              {initialCourseId ? "Editing existing program" : "Create a new industry-ready course"}
            </p>
          </div>
        </div>

        {/* Autosave Status */}
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Saved draft at {lastSaved}
            </span>
          )}
          <button
            onClick={saveDraft}
            disabled={saving}
            id="btn-save-draft"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-600 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Draft"}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`rounded-xl p-4 text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Step Stepper Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6 overflow-x-auto">
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => setStep(s.num)}
              className="flex items-center gap-2 group cursor-pointer text-left whitespace-nowrap"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/30"
                    : step > s.num
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === s.num ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              >
                {s.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 bg-zinc-800 hidden sm:block" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Course Basics</h2>
            <p className="text-xs text-zinc-400">Give your program a compelling title, slug, and category.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Course Title *</label>
              <input
                id="input-course-title"
                type="text"
                placeholder="e.g. Full Stack Next.js 15 & AI Apps Mastery"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">URL Slug (Auto-generated) *</label>
              <input
                id="input-course-slug"
                type="text"
                placeholder="nextjs-fullstack-ai-mastery"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Subtitle / Pitch *</label>
              <input
                id="input-course-subtitle"
                type="text"
                placeholder="Build production-grade GenAI apps with Next.js 15, LangChain, and Vector DBs."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Description *</label>
              <textarea
                id="input-course-desc"
                rows={4}
                placeholder="Detailed curriculum overview, what makes this course unique, and who should take it."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Category *</label>
                <select
                  id="select-course-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    const found = categories.find((c) => c.slug === e.target.value || c.id === e.target.value);
                    if (found) setCategoryName(found.name);
                  }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Add New Category */}
                {!showAddCategory ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add new category
                  </button>
                ) : (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3 space-y-2.5 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">New Category</span>
                      <button
                        type="button"
                        onClick={() => { setShowAddCategory(false); setNewCategoryName(""); setNewCategoryDesc(""); }}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Category name (e.g. Cybersecurity)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Short description (optional)"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim() || savingCategory}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                      >
                        <Tag className="h-3 w-3" />
                        {savingCategory ? "Saving..." : "Create Category"}
                      </button>
                      <span className="text-[10px] text-zinc-500">Slug auto-generated from name</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Level *</label>
                <select
                  id="select-course-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all_levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Language *</label>
                <select
                  id="select-course-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Tags (Comma-separated)</label>
              <input
                id="input-course-tags"
                type="text"
                placeholder="Next.js, React, Tailwind, Cloud"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 2 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Pricing Model</h2>
            <p className="text-xs text-zinc-400">Offer your course for free to build an audience or set an INR price.</p>
          </div>

          <div className="space-y-6">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 cursor-pointer">
              <input
                id="checkbox-is-free"
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <span className="text-sm font-bold text-white">Make this course 100% Free</span>
                <p className="text-xs text-zinc-400">Learners can enroll instantly with one click without any payment.</p>
              </div>
            </label>

            {!isFree && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Base Price (₹ INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₹</span>
                    <input
                      id="input-price-inr"
                      type="number"
                      placeholder="1999"
                      value={priceInInr}
                      onChange={(e) => setPriceInInr(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-8 pr-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">Stored server-side in paise (e.g. ₹1,999 = 199,900 paise)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Discount / Offer Price (Optional ₹ INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₹</span>
                    <input
                      id="input-discount-inr"
                      type="number"
                      placeholder="999"
                      value={discountInInr}
                      onChange={(e) => setDiscountInInr(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-8 pr-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">If set, original price will be struck through with a discount badge.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Curriculum */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Curriculum & Lessons</h2>
              <p className="text-xs text-zinc-400">
                Organize your course into structured modules and lessons.
              </p>
            </div>
            <button
              onClick={addModule}
              id="btn-add-module"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                {/* Module Header Form */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-violet-400">Module {modIdx + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setModules(modules.map((m) => (m.id === mod.id ? { ...m, title: newTitle } : m)));
                      }}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  {modules.length > 1 && (
                    <button
                      onClick={() => deleteModule(mod.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Delete Module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lessons in Module */}
                <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-zinc-800">
                  {mod.lessons.map((les, lesIdx) => (
                    <div
                      key={les.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          {les.type === "video" ? (
                            <PlayCircle className="h-4 w-4 text-violet-400 shrink-0" />
                          ) : les.type === "pdf" ? (
                            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <LinkIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                          )}
                          <input
                            type="text"
                            value={les.title}
                            onChange={(e) => {
                              const newT = e.target.value;
                              setModules(
                                modules.map((m) =>
                                  m.id === mod.id
                                    ? {
                                        ...m,
                                        lessons: m.lessons.map((l) =>
                                          l.id === les.id ? { ...l, title: newT } : l
                                        ),
                                      }
                                    : m
                                )
                              );
                            }}
                            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-white focus:border-violet-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Lesson Type */}
                          <select
                            value={les.type}
                            onChange={(e) => {
                              const newType = e.target.value as LessonType;
                              setModules(
                                modules.map((m) =>
                                  m.id === mod.id
                                    ? {
                                        ...m,
                                        lessons: m.lessons.map((l) =>
                                          l.id === les.id ? { ...l, type: newType } : l
                                        ),
                                      }
                                    : m
                                )
                              );
                            }}
                            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                          >
                            <option value="video">Video</option>
                            <option value="pdf">PDF Document</option>
                            <option value="text">Reading / Text</option>
                            <option value="link">External Link</option>
                          </select>

                          {/* Free Preview Toggle */}
                          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={les.isPreview}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setModules(
                                  modules.map((m) =>
                                    m.id === mod.id
                                      ? {
                                          ...m,
                                          lessons: m.lessons.map((l) =>
                                            l.id === les.id ? { ...l, isPreview: checked } : l
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="rounded border-zinc-700 bg-zinc-900 text-violet-600"
                            />
                            <span>Preview</span>
                          </label>

                          {mod.lessons.length > 1 && (
                            <button
                              onClick={() => deleteLesson(mod.id, les.id)}
                              className="text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Video Metadata input if video */}
                      {les.type === "video" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Provider</label>
                            <select
                              value={les.videoProvider || "youtube"}
                              onChange={(e) => {
                                const prov = e.target.value as any;
                                setModules(
                                  modules.map((m) =>
                                    m.id === mod.id
                                      ? {
                                          ...m,
                                          lessons: m.lessons.map((l) =>
                                            l.id === les.id ? { ...l, videoProvider: prov } : l
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                            >
                              <option value="youtube">YouTube (Unlisted / Embed)</option>
                              <option value="googledrive">Google Drive (Share Link)</option>
                              <option value="mux">Mux Video</option>
                              <option value="bunny">Bunny CDN</option>
                              <option value="vimeo">Vimeo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">
                              {les.videoProvider === "googledrive" ? "Google Drive Share Link" : "Video ID or YouTube URL"}
                            </label>
                            <input
                              type="text"
                              placeholder={
                                les.videoProvider === "googledrive"
                                  ? "https://drive.google.com/file/d/.../view"
                                  : "e.g. https://youtu.be/... or ID"
                              }
                              value={les.videoId || ""}
                              onChange={(e) => {
                                const vId = e.target.value;
                                // Auto-switch provider if user pastes a drive link
                                const isDrive = vId.includes("drive.google.com");
                                const autoProv = isDrive ? "googledrive" : les.videoProvider || "youtube";
                                setModules(
                                  modules.map((m) =>
                                    m.id === mod.id
                                      ? {
                                          ...m,
                                          lessons: m.lessons.map((l) =>
                                            l.id === les.id ? { ...l, videoId: vId, videoProvider: autoProv } : l
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Duration (Minutes)</label>
                            <input
                              type="number"
                              value={les.durationMinutes}
                              onChange={(e) => {
                                const dur = parseInt(e.target.value, 10) || 0;
                                setModules(
                                  modules.map((m) =>
                                    m.id === mod.id
                                      ? {
                                          ...m,
                                          lessons: m.lessons.map((l) =>
                                            l.id === les.id ? { ...l, durationMinutes: dur } : l
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addLesson(mod.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 pt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Lesson to Module</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Media & Details */}
      {step === 4 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Media & Highlights</h2>
            <p className="text-xs text-zinc-400">Course visual assets and key learning outcomes.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Thumbnail URL *</label>
              <input
                id="input-thumbnail-url"
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
              {thumbnailUrl && (
                <div className="mt-3 aspect-video w-64 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Promo Video URL (Optional)</label>
              <input
                id="input-promo-video-url"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={promoVideoUrl}
                onChange={(e) => setPromoVideoUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Learning Outcomes */}
            <div className="border-t border-zinc-800 pt-6">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">What learners will achieve (Outcomes)</label>
              <div className="space-y-2 mb-3">
                {outcomes.map((out, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-200 border border-zinc-800">
                    <span>{out}</span>
                    <button
                      onClick={() => setOutcomes(outcomes.filter((_, i) => i !== idx))}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Master Server Components and Actions"
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (outcomeInput.trim()) {
                      setOutcomes([...outcomes, outcomeInput.trim()]);
                      setOutcomeInput("");
                    }
                  }}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Requirements */}
            <div className="border-t border-zinc-800 pt-6">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Requirements & Prerequisites</label>
              <div className="space-y-2 mb-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-200 border border-zinc-800">
                    <span>{req}</span>
                    <button
                      onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Basic knowledge of JavaScript"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (requirementInput.trim()) {
                      setRequirements([...requirements, requirementInput.trim()]);
                      setRequirementInput("");
                    }
                  }}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {step === 5 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-base font-bold text-white">Review & Submit Program</h2>
            <p className="text-xs text-zinc-400">
              Check your live course card preview and verify readiness before submitting for admin review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Live Course Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Live Catalog Card Preview</span>
              <div className="max-w-sm pointer-events-none">
                <CourseCard course={previewCourse} />
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Submission Readiness Checklist</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  {title.trim().length > 5 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className={title.trim().length > 5 ? "text-zinc-200" : "text-rose-300"}>
                    Course title provided ({title || "Missing"})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {modules.length >= 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className={modules.length >= 1 ? "text-zinc-200" : "text-rose-300"}>
                    At least 1 module created ({modules.length} created)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {modules.some((m) => m.lessons.length > 0) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className={modules.some((m) => m.lessons.length > 0) ? "text-zinc-200" : "text-rose-300"}>
                    At least 1 lesson included ({modules.reduce((a, b) => a + b.lessons.length, 0)} total lessons)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {thumbnailUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className={thumbnailUrl ? "text-zinc-200" : "text-rose-300"}>
                    Thumbnail image set
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isFree || parseInt(priceInInr, 10) > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className={isFree || parseInt(priceInInr, 10) > 0 ? "text-zinc-200" : "text-rose-300"}>
                    Pricing defined ({isFree ? "Free" : `₹${priceInInr}`})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-zinc-800 pt-5 space-y-3">
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting || !title || modules.length === 0}
                  id="btn-final-submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Submitting to Admin..." : "Submit Course for Review"}</span>
                </button>

                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Draft & Finish Later</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Prev / Next) */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            id="btn-wizard-prev"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Step</span>
          </button>
        ) : <div />}

        {step < 5 ? (
          <button
            onClick={() => {
              saveDraft();
              setStep(step + 1);
            }}
            id="btn-wizard-next"
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500"
          >
            <span>Next: {steps[step]?.label}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
