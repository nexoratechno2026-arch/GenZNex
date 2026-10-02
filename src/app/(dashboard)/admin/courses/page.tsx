"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  Eye,
  Star,
  Search,
  RefreshCw,
  FolderPlus,
  History,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { CourseDoc, CategoryDoc, AuditLogDoc, CourseStatus } from "@/types/schema";
import { formatPrice } from "@/components/courses/CourseCard";

export default function AdminCoursesPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"queue" | "all_courses" | "categories" | "audit">("queue");
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCourseForReject, setSelectedCourseForReject] = useState<CourseDoc | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // Filters
  const [allCoursesFilter, setAllCoursesFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch courses
      const coursesCol = collection(db, "courses");
      const cSnap = await getDocs(coursesCol);
      const cList: CourseDoc[] = [];
      cSnap.forEach((snap) => {
        cList.push({ id: snap.id, ...(snap.data() as Omit<CourseDoc, "id">) });
      });
      setCourses(cList);

      // 2. Fetch categories
      const catCol = collection(db, "categories");
      const catSnap = await getDocs(query(catCol, orderBy("order", "asc")));
      const catList: CategoryDoc[] = [];
      catSnap.forEach((snap) => {
        catList.push({ id: snap.id, ...(snap.data() as Omit<CategoryDoc, "id">) });
      });
      setCategories(catList);

      // 3. Fetch audit logs
      const auditCol = collection(db, "audit_logs");
      const auditSnap = await getDocs(query(auditCol, orderBy("timestamp", "desc"), limit(20)));
      const aList: AuditLogDoc[] = [];
      auditSnap.forEach((snap) => {
        aList.push({ id: snap.id, ...(snap.data() as Omit<AuditLogDoc, "id">) });
      });
      setAuditLogs(aList);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approve Course Handler
  const handleApprove = async (courseId: string) => {
    setActionLoading(courseId);
    setActionNotice(null);
    try {
      const approveFn = httpsCallable(functions, "approveCourse");
      await approveFn({ courseId });
      setActionNotice({ type: "success", text: "Course approved and published to catalog!" });
      await fetchData();
    } catch (err: any) {
      console.error("Approval failed:", err);
      setActionNotice({ type: "error", text: err.message || "Failed to approve course." });
    } finally {
      setActionLoading(null);
    }
  };

  // Reject Course Handler
  const handleRejectConfirm = async () => {
    if (!selectedCourseForReject || !rejectionReasonInput.trim()) return;

    setActionLoading(selectedCourseForReject.id);
    setActionNotice(null);
    try {
      const rejectFn = httpsCallable(functions, "rejectCourse");
      await rejectFn({
        courseId: selectedCourseForReject.id,
        reason: rejectionReasonInput.trim(),
      });
      setActionNotice({
        type: "success",
        text: `Course rejected with feedback sent to ${selectedCourseForReject.instructor?.name || "the trainer"}.`,
      });
      setRejectModalOpen(false);
      setSelectedCourseForReject(null);
      setRejectionReasonInput("");
      await fetchData();
    } catch (err: any) {
      console.error("Rejection failed:", err);
      setActionNotice({ type: "error", text: err.message || "Failed to reject course." });
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (course: CourseDoc) => {
    setActionLoading(course.id);
    try {
      const newFeatured = !course.isFeatured;
      const courseRef = doc(db, "courses", course.id);
      await updateDoc(courseRef, {
        isFeatured: newFeatured,
        updatedAt: serverTimestamp(),
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isFeatured: newFeatured } : c))
      );
      setActionNotice({
        type: "success",
        text: `Course ${newFeatured ? "featured" : "unfeatured"} successfully.`,
      });
    } catch (err: any) {
      console.error("Toggle featured failed:", err);
      setActionNotice({ type: "error", text: "Failed to update featured flag: " + err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    try {
      const catId = newCatSlug.toLowerCase().trim();
      await setDoc(doc(db, "categories", catId), {
        id: catId,
        name: newCatName.trim(),
        slug: newCatSlug.trim(),
        description: newCatDesc.trim(),
        icon: "BookOpen",
        courseCount: 0,
        order: categories.length + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActionNotice({ type: "success", text: `Category "${newCatName}" added successfully!` });
      setCategoryModalOpen(false);
      setNewCatName("");
      setNewCatSlug("");
      setNewCatDesc("");
      await fetchData();
    } catch (err: any) {
      console.error("Failed to add category:", err);
      setActionNotice({ type: "error", text: err.message || "Failed to add category." });
    }
  };

  const pendingCourses = courses.filter((c) => c.status === "pending_review");

  const filteredAllCourses = courses.filter((c) => {
    const matchesStatus = allCoursesFilter === "all" || c.status === allCoursesFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-800 bg-gradient-to-r from-violet-950/40 via-zinc-950/60 to-transparent backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Review & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Course Management Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Approve submissions, govern curriculum quality, manage categories, and audit actions.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`rounded-xl p-4 text-xs flex items-center justify-between ${
            actionNotice.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        {[
          { id: "queue", label: "Pending Review Queue", count: pendingCourses.length },
          { id: "all_courses", label: "All Courses Directory", count: courses.length },
          { id: "categories", label: "Category Taxonomy", count: categories.length },
          { id: "audit", label: "Security Audit Logs", count: auditLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Pending Review Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Course Submissions ({pendingCourses.length})
            </h2>
            <span className="text-xs text-zinc-400">
              Courses submitted by trainers awaiting review
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : pendingCourses.length > 0 ? (
            <div className="space-y-4">
              {pendingCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-amber-500/30 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-xl space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop"}
                        alt={course.title}
                        className="h-24 w-36 rounded-xl object-cover shrink-0 border border-zinc-800"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                            Action Required
                          </span>
                          <span className="text-xs text-zinc-400">{course.categoryName || course.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{course.title}</h3>
                        <p className="text-xs text-zinc-300 line-clamp-2">{course.subtitle || course.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                          <span>Instructor: <strong className="text-white">{course.instructor?.name}</strong></span>
                          <span>Price: <strong className="text-white">{formatPrice(course.priceInPaise)}</strong></span>
                          <span>Lessons: <strong className="text-white">{course.lessonCount || 0}</strong></span>
                          {course.totalDurationMinutes ? (
                            <span>Duration: <strong className="text-white">{Math.round(course.totalDurationMinutes / 60)} hrs</strong></span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-center">
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview Course</span>
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedCourseForReject(course);
                          setRejectionReasonInput("");
                          setRejectModalOpen(true);
                        }}
                        id={`btn-reject-${course.id}`}
                        disabled={actionLoading === course.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Reject with Reason</span>
                      </button>

                      <button
                        onClick={() => handleApprove(course.id)}
                        id={`btn-approve-${course.id}`}
                        disabled={actionLoading === course.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoading === course.id ? "Approving..." : "Approve & Publish"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">Review queue is empty</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                All submitted courses have been reviewed. Outstanding!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Courses Directory */}
      {activeTab === "all_courses" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Filter status:</span>
              <select
                value={allCoursesFilter}
                onChange={(e) => setAllCoursesFilter(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="pending_review">Pending Review</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search courses or trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Trainer</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Featured</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredAllCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-white max-w-xs truncate">
                        {c.title}
                      </td>
                      <td className="px-4 py-4 text-zinc-400">
                        {c.categoryName || c.category}
                      </td>
                      <td className="px-4 py-4 text-zinc-300">
                        {c.instructor?.name || "Trainer"}
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-200">
                        {formatPrice(c.priceInPaise)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.status === "pending_review"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : c.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(c)}
                          id={`toggle-featured-${c.id}`}
                          className={`rounded-full p-1.5 transition-colors ${
                            c.isFeatured
                              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                          title={c.isFeatured ? "Unfeature from homepage" : "Feature on homepage"}
                        >
                          <Star className={`h-4 w-4 ${c.isFeatured ? "fill-current" : ""}`} />
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold"
                        >
                          <span>View</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Category Taxonomy */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Category Taxonomy ({categories.length})
              </h2>
              <p className="text-xs text-zinc-400">Platform course taxonomy and domain classification.</p>
            </div>
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500 shadow-md shadow-violet-600/30"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    Order {cat.order}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{cat.description}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Slug: <code className="text-violet-400">{cat.slug}</code></span>
                  <Link
                    href={`/courses/category/${cat.slug}`}
                    target="_blank"
                    className="text-violet-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable Governance Audit Trail
            </h2>
            <p className="text-xs text-zinc-400">
              Every course approval, rejection, and role escalation is cryptographically verifiable in Firestore security rules.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800/60">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/20 uppercase">
                        {log.action}
                      </span>
                      <span className="text-zinc-300 font-semibold">{log.actorEmail}</span>
                      <span className="text-zinc-500">({log.actorRole})</span>
                    </div>
                    <p className="text-zinc-400">
                      Target ID: <code className="text-zinc-300">{log.targetId}</code>
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                No recent audit logs recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Course Modal */}
      {rejectModalOpen && selectedCourseForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Course Submission</h3>
                <p className="text-xs text-zinc-400">Provide actionable feedback to the trainer</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Rejecting <strong className="text-white">"{selectedCourseForReject.title}"</strong> requires a specific explanation so the trainer can fix issues and resubmit.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Rejection Reason / Guidance *</label>
              <textarea
                id="textarea-rejection-reason"
                rows={4}
                placeholder="e.g. Module 2 needs additional video lessons, or syllabus details are missing..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                id="btn-confirm-reject"
                disabled={!rejectionReasonInput.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleAddCategory} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Category</h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Cybersecurity & Ethical Hacking"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">URL Slug *</label>
              <input
                type="text"
                placeholder="cybersecurity"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary of what this category covers."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 shadow-md shadow-violet-600/30 disabled:opacity-50"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
