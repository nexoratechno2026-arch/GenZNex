import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const db = getFirestore(app);

async function main() {
  const courseId = "course_1791091020997";
  const courseRef = db.collection("courses").doc(courseId);

  await courseRef.set({
    id: courseId,
    title: "Data Science Mastery & Analytics",
    slug: "data-science",
    subtitle: "Complete Data Science Bootcamp in Tamil: Python, Pandas, Machine Learning, and Real-world Projects",
    description: "Learn Data Science from scratch with AI Coach John. Includes hands-on projects, statistical analysis, and end-to-end data analytics pipelines.",
    category: "data-analytics",
    categoryName: "Data Analytics",
    tags: ["Data Science", "Python", "Tamil", "Analytics"],
    level: "beginner",
    language: "Tamil",
    priceInPaise: 199900,
    discountPriceInPaise: 99900,
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    promoVideoUrl: "https://youtu.be/55WrjuuKSWg?si=KMwJOiQPGC00NEYg",
    learningOutcomes: [
      "Understand the fundamentals of Data Science and AI",
      "Analyze data with Python and Pandas",
      "Build real-world predictive models",
    ],
    requirements: ["Basic computer literacy", "Interest in technology"],
    instructor: {
      uid: "trainer_vikram_01",
      name: "AI Coach John",
      headline: "Data Science & AI Mentor",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    },
    trainerId: "trainer_vikram_01",
    status: "published",
    isFeatured: true,
    rating: 4.9,
    ratingCount: 120,
    enrollmentCount: 450,
    lessonCount: 3,
    totalDurationMinutes: 180,
    publishedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  const modRef = courseRef.collection("modules").doc("mod_1");
  await modRef.set({
    id: "mod_1",
    courseId: courseId,
    title: "Module 1: Introduction to Data Science",
    description: "Core concepts, ecosystem overview, and career roadmap.",
    order: 1,
    lessonCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  const lesRef = modRef.collection("lessons").doc("les_1_1");
  await lesRef.set({
    id: "les_1_1",
    courseId: courseId,
    moduleId: "mod_1",
    title: "What is Data Science (Tamil)?",
    order: 1,
    type: "video",
    durationMinutes: 20,
    isPreview: true,
    videoMetadata: {
      provider: "youtube",
      videoId: "https://youtu.be/55WrjuuKSWg?si=KMwJOiQPGC00NEYg",
      durationSeconds: 1200,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  console.log("✅ Restored course 'data-science' (course_1791091020997) with lesson 'les_1_1'");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
