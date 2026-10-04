import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const db = getFirestore(app);

const KEPT_COURSE_ID = "course_1791091020997";

async function deleteCollection(collectionPath: string, batchSize = 100) {
  const colRef = db.collection(collectionPath);
  const snapshot = await colRef.limit(batchSize).get();

  if (snapshot.empty) return;

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    // Delete any subcollections recursively
    try {
      const subcols = await doc.ref.listCollections();
      for (const subcol of subcols) {
        await deleteCollection(subcol.path, batchSize);
      }
    } catch {}
    batch.delete(doc.ref);
  }
  await batch.commit();

  // Recursively delete if more remain
  await deleteCollection(collectionPath, batchSize);
}

async function main() {
  console.log("🧹 Starting targeted database purge of fake data...");

  // 1. Purge all courses EXCEPT the real Data Science course
  console.log(`\n📚 Cleaning courses (preserving ${KEPT_COURSE_ID})...`);
  const coursesSnap = await db.collection("courses").get();
  let deletedCoursesCount = 0;

  for (const cDoc of coursesSnap.docs) {
    if (cDoc.id === KEPT_COURSE_ID) {
      console.log(`   🛡️ KEEPING: ${cDoc.data().title} (${cDoc.id})`);
      continue;
    }

    // Delete subcollections for fake course (modules -> lessons, quizzes, assignments, reviews)
    try {
      const subcols = await cDoc.ref.listCollections();
      for (const subcol of subcols) {
        await deleteCollection(subcol.path);
      }
    } catch (e) {
      console.warn(`   Subcollection check for ${cDoc.id}:`, e);
    }

    await cDoc.ref.delete();
    deletedCoursesCount++;
    console.log(`   🗑️ Deleted fake course: ${cDoc.data().title || cDoc.id}`);
  }
  console.log(`   ✅ Removed ${deletedCoursesCount} fake courses.`);

  // 2. Collections to completely purge
  const fakeCollections = [
    "training_programs",
    "program_batches",
    "batch_enrollments",
    "live_sessions",
    "session_attendance",
    "capstone_projects",
    "project_teams",
    "project_submissions",
    "showcase",
    "aptitude_tests",
    "question_bank",
    "mock_interviews",
    "interview_availability",
    "jobs",
    "job_applications",
    "resumes",
    "stats_daily",
    "forum_posts",
    "forum_votes",
    "notifications",
    "badges",
    "leaderboard_snapshots",
    "xp_ledger",
    "audit_logs",
    "payments",
    "certificates",
  ];

  console.log("\n📦 Purging synthetic collections...");
  for (const colName of fakeCollections) {
    await deleteCollection(colName);
    console.log(`   🗑️ Purged /${colName}`);
  }

  // 3. Clean enrollments not related to kept course
  console.log("\n📋 Cleaning enrollments...");
  const enrollSnap = await db.collection("enrollments").get();
  for (const eDoc of enrollSnap.docs) {
    const data = eDoc.data();
    if (data.courseId && data.courseId !== KEPT_COURSE_ID) {
      // Delete subcollections (lesson_progress, notes, bookmarks)
      try {
        const subcols = await eDoc.ref.listCollections();
        for (const subcol of subcols) {
          await deleteCollection(subcol.path);
        }
      } catch {}
      await eDoc.ref.delete();
      console.log(`   🗑️ Deleted enrollment: ${eDoc.id}`);
    }
  }

  // 4. Update category course counts accurately
  console.log("\n🏷️ Updating Category course counts...");
  const catsSnap = await db.collection("categories").get();
  for (const catDoc of catsSnap.docs) {
    const isDataAnalytics = catDoc.id === "data-analytics" || catDoc.data().slug === "data-analytics";
    await catDoc.ref.update({
      courseCount: isDataAnalytics ? 1 : 0,
    });
  }
  console.log("   ✅ Updated categories: only Data Analytics has 1 active course.");

  console.log("\n✨ Database cleanup complete! Clean real-world state active.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
