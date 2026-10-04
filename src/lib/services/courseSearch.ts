import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  CourseDoc,
  CategoryDoc,
  ModuleDoc,
  LessonDoc,
  CourseLevel,
  CourseLanguage,
  CourseStatus,
} from "@/types/schema";

export interface CourseSearchFilters {
  query?: string;
  category?: string;
  level?: CourseLevel | "all";
  language?: CourseLanguage | "all";
  price?: "all" | "free" | "paid";
  minRating?: number;
  sort?: "popular" | "newest" | "price_asc" | "price_desc" | "rating";
  pageSize?: number;
  lastDocId?: string;
  status?: CourseStatus;
}

export interface CourseSearchResult {
  courses: CourseDoc[];
  totalEstimate: number;
  lastDocId?: string;
  hasMore: boolean;
}

/**
 * GenZNex Course Search & Catalog Abstraction
 *
 * ARCHITECTURAL NOTE ON FIRESTORE SEARCH:
 * Firestore does not provide native full-text search capabilities across multiple fields.
 * Here, we implement prefix, keyword, and tag-based filtering behind `searchCourses()`.
 * In later production phases, this service can easily be swapped with Algolia or Typesense
 * without requiring any refactoring of consuming UI components.
 */
export async function searchCourses(filters: CourseSearchFilters = {}): Promise<CourseSearchResult> {
  const {
    query: searchQuery = "",
    category,
    level,
    language,
    price = "all",
    minRating = 0,
    sort = "popular",
    pageSize = 12,
    lastDocId,
    status = "published",
  } = filters;

  const coursesCol = collection(db, "courses");
  let courses: CourseDoc[] = [];

  try {
    // 1. Primary query: Fetch courses by status
    const qStatus = query(coursesCol, where("status", "==", status));
    const snapshot = await getDocs(qStatus);
    snapshot.forEach((snap) => {
      courses.push({ id: snap.id, ...(snap.data() as Omit<CourseDoc, "id">) });
    });
  } catch (err) {
    console.warn("[CourseSearch] Primary status query failed, attempting general fetch:", err);
  }

  // 2. Resilient Fallback: If 0 courses found or query failed, fetch all courses and filter published/approved
  if (courses.length === 0) {
    try {
      const qAll = query(coursesCol, limit(100));
      const allSnap = await getDocs(qAll);
      allSnap.forEach((snap) => {
        const data = snap.data() as Omit<CourseDoc, "id">;
        if (data.status === "published" || (data.status as string) === "approved" || data.isPublished === true) {
          courses.push({ id: snap.id, ...data });
        }
      });
    } catch (err) {
      console.error("[CourseSearch] General fetch fallback error:", err);
    }
  }

  // Deduplicate courses by ID
  const courseMap = new Map<string, CourseDoc>();
  courses.forEach((c) => courseMap.set(c.id, c));
  courses = Array.from(courseMap.values());

  // 3. Category filter (matches category slug or categoryName)
  if (category && category !== "all") {
    const catLower = category.toLowerCase().trim();
    courses = courses.filter((c) => {
      const cCat = (c.category || "").toLowerCase().trim();
      const cCatName = (c.categoryName || "").toLowerCase().trim();
      return cCat === catLower || cCatName === catLower || cCat.includes(catLower);
    });
  }

  // 4. Level filter
  if (level && level !== "all") {
    courses = courses.filter((c) => c.level === level);
  }

  // 5. Language filter
  if (language && language !== "all") {
    courses = courses.filter((c) => (c.language || "English").toLowerCase() === language.toLowerCase());
  }

  // 6. Free vs Paid filter
  if (price === "free") {
    courses = courses.filter((c) => (c.priceInPaise || 0) === 0);
  } else if (price === "paid") {
    courses = courses.filter((c) => (c.priceInPaise || 0) > 0);
  }

  // 7. Search text filter (title, subtitle, categoryName, instructor.name, tags)
  if (searchQuery.trim().length > 0) {
    const qLower = searchQuery.toLowerCase().trim();
    courses = courses.filter((c) => {
      const titleMatch = (c.title || "").toLowerCase().includes(qLower);
      const subtitleMatch = (c.subtitle || "").toLowerCase().includes(qLower);
      const categoryMatch = (c.categoryName || "").toLowerCase().includes(qLower);
      const instructorMatch = (c.instructor?.name || c.trainerName || "").toLowerCase().includes(qLower);
      const tagMatch = c.tags?.some((t) => t.toLowerCase().includes(qLower));
      return titleMatch || subtitleMatch || categoryMatch || instructorMatch || tagMatch;
    });
  }

  // 8. Min rating filter
  if (minRating > 0) {
    courses = courses.filter((c) => (c.rating || 0) >= minRating);
  }

  // 9. Safe In-memory Sorting (never drops courses with missing fields!)
  courses.sort((a, b) => {
    switch (sort) {
      case "popular":
        return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      case "newest": {
        const timeA = (a.publishedAt as any)?.toMillis?.() || (a.createdAt as any)?.toMillis?.() || 0;
        const timeB = (b.publishedAt as any)?.toMillis?.() || (b.createdAt as any)?.toMillis?.() || 0;
        return timeB - timeA;
      }
      case "price_asc":
        return (a.priceInPaise || 0) - (b.priceInPaise || 0);
      case "price_desc":
        return (b.priceInPaise || 0) - (a.priceInPaise || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
    }
  });

  const totalEstimate = courses.length;
  const hasMore = courses.length > pageSize;
  const paginatedCourses = courses.slice(0, pageSize);
  const nextLastDocId = paginatedCourses.length > 0 ? paginatedCourses[paginatedCourses.length - 1].id : undefined;

  return {
    courses: paginatedCourses,
    totalEstimate,
    lastDocId: nextLastDocId,
    hasMore,
  };
}

/**
 * Fetch a single course by its URL slug
 */
export async function getCourseBySlug(slug: string): Promise<CourseDoc | null> {
  const coursesCol = collection(db, "courses");
  try {
    const q = query(coursesCol, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...(docSnap.data() as Omit<CourseDoc, "id">) };
    }
  } catch (err) {
    console.warn("[CourseSearch] getCourseBySlug query error:", err);
  }

  // Fallback: check if slug matches course ID directly
  try {
    const directDoc = await getDoc(doc(db, "courses", slug));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...(directDoc.data() as Omit<CourseDoc, "id">) };
    }
  } catch (e) {}

  return null;
}

/**
 * Fetch complete curriculum (modules and lessons) for a course
 */
export interface CourseCurriculum {
  modules: ModuleDoc[];
  lessonsByModule: Record<string, LessonDoc[]>;
}

export async function getCourseCurriculum(courseId: string): Promise<CourseCurriculum> {
  const modulesCol = collection(db, "courses", courseId, "modules");
  const modQuery = query(modulesCol, orderBy("order", "asc"));
  const modSnapshot = await getDocs(modQuery);

  const modules: ModuleDoc[] = [];
  const lessonsByModule: Record<string, LessonDoc[]> = {};

  for (const mDoc of modSnapshot.docs) {
    const modData = { id: mDoc.id, ...(mDoc.data() as Omit<ModuleDoc, "id">) };
    modules.push(modData);

    const lessonsCol = collection(db, "courses", courseId, "modules", mDoc.id, "lessons");
    const lesQuery = query(lessonsCol, orderBy("order", "asc"));
    const lesSnapshot = await getDocs(lesQuery);

    lessonsByModule[mDoc.id] = lesSnapshot.docs.map((lDoc) => ({
      id: lDoc.id,
      ...(lDoc.data() as Omit<LessonDoc, "id">),
    }));
  }

  return { modules, lessonsByModule };
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<CategoryDoc[]> {
  try {
    const catCol = collection(db, "categories");
    const snapshot = await getDocs(catCol);

    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<CategoryDoc, "id">),
    }));
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return [];
  }
}

/**
 * Fetch featured courses for homepage and promotions
 */
export async function getFeaturedCourses(limitCount = 4): Promise<CourseDoc[]> {
  try {
    const res = await searchCourses({ pageSize: limitCount * 2 });
    const featured = res.courses.filter((c) => c.isFeatured);
    return (featured.length > 0 ? featured : res.courses).slice(0, limitCount);
  } catch (e) {
    console.warn("getFeaturedCourses error:", e);
    return [];
  }
}

/**
 * Fetch popular published courses
 */
export async function getPopularCourses(limitCount = 6): Promise<CourseDoc[]> {
  try {
    const res = await searchCourses({ sort: "popular", pageSize: limitCount });
    return res.courses;
  } catch (e) {
    console.warn("getPopularCourses error:", e);
    return [];
  }
}
