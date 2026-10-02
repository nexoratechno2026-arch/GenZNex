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
  const constraints: QueryConstraint[] = [];

  // Filter by course status (default: 'published' for public catalog)
  constraints.push(where("status", "==", status));

  // Category filter (slug or ID)
  if (category && category !== "all") {
    constraints.push(where("category", "==", category));
  }

  // Level filter
  if (level && level !== "all") {
    constraints.push(where("level", "==", level));
  }

  // Language filter
  if (language && language !== "all") {
    constraints.push(where("language", "==", language));
  }

  // Free vs Paid filter
  if (price === "free") {
    constraints.push(where("priceInPaise", "==", 0));
  } else if (price === "paid") {
    constraints.push(where("priceInPaise", ">", 0));
  }

  // Sorting
  switch (sort) {
    case "popular":
      constraints.push(orderBy("enrollmentCount", "desc"));
      break;
    case "newest":
      constraints.push(orderBy("createdAt", "desc"));
      break;
    case "price_asc":
      constraints.push(orderBy("priceInPaise", "asc"));
      break;
    case "price_desc":
      constraints.push(orderBy("priceInPaise", "desc"));
      break;
    case "rating":
      constraints.push(orderBy("rating", "desc"));
      break;
    default:
      constraints.push(orderBy("enrollmentCount", "desc"));
      break;
  }

  // Pagination support
  let lastDocSnap: DocumentSnapshot | null = null;
  if (lastDocId) {
    try {
      const docRef = doc(db, "courses", lastDocId);
      lastDocSnap = await getDoc(docRef);
    } catch (e) {
      // Fallback if document not found
    }
  }

  if (lastDocSnap && lastDocSnap.exists()) {
    constraints.push(startAfter(lastDocSnap));
  }

  // Request pageSize + 1 to determine hasMore
  constraints.push(limit(pageSize + 1));

  const q = query(coursesCol, ...constraints);
  const snapshot = await getDocs(q);

  let courses: CourseDoc[] = [];
  snapshot.forEach((snap) => {
    courses.push({ id: snap.id, ...(snap.data() as Omit<CourseDoc, "id">) });
  });

  const hasMore = courses.length > pageSize;
  if (hasMore) {
    courses = courses.slice(0, pageSize);
  }

  // Client-side text filter for search query keywords and minRating fallback
  if (searchQuery.trim().length > 0) {
    const qLower = searchQuery.toLowerCase().trim();
    courses = courses.filter((c) => {
      const titleMatch = c.title.toLowerCase().includes(qLower);
      const subtitleMatch = c.subtitle?.toLowerCase().includes(qLower);
      const categoryMatch = c.categoryName?.toLowerCase().includes(qLower);
      const instructorMatch = c.instructor?.name?.toLowerCase().includes(qLower);
      const tagMatch = c.tags?.some((t) => t.toLowerCase().includes(qLower));
      return titleMatch || subtitleMatch || categoryMatch || instructorMatch || tagMatch;
    });
  }

  if (minRating > 0) {
    courses = courses.filter((c) => (c.rating || 0) >= minRating);
  }

  const nextLastDocId = courses.length > 0 ? courses[courses.length - 1].id : undefined;

  return {
    courses,
    totalEstimate: courses.length,
    lastDocId: nextLastDocId,
    hasMore,
  };
}

/**
 * Fetch a single course by its URL slug
 */
export async function getCourseBySlug(slug: string): Promise<CourseDoc | null> {
  const coursesCol = collection(db, "courses");
  const q = query(coursesCol, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as Omit<CourseDoc, "id">) };
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
  const catCol = collection(db, "categories");
  const q = query(catCol, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<CategoryDoc, "id">),
  }));
}

/**
 * Fetch featured courses for homepage and promotions
 */
export async function getFeaturedCourses(limitCount = 4): Promise<CourseDoc[]> {
  const coursesCol = collection(db, "courses");
  const q = query(
    coursesCol,
    where("status", "==", "published"),
    where("isFeatured", "==", true),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CourseDoc, "id">),
  }));
}

/**
 * Fetch popular published courses
 */
export async function getPopularCourses(limitCount = 6): Promise<CourseDoc[]> {
  const coursesCol = collection(db, "courses");
  const q = query(
    coursesCol,
    where("status", "==", "published"),
    orderBy("enrollmentCount", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CourseDoc, "id">),
  }));
}
