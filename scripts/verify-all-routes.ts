/**
 * Verify All GenZNex App Routes (Phase 1 to Phase 5)
 */

interface RouteCheck {
  path: string;
  name: string;
  phase: string;
  expectedStatus?: number;
}

const routesToTest: RouteCheck[] = [
  // Phase 1: Foundation & Auth
  { path: "/", name: "Homepage & Zero-Trust Architecture", phase: "Phase 1" },
  { path: "/login", name: "User Sign In & Phone OTP Trigger", phase: "Phase 1" },
  { path: "/signup", name: "User Registration & Role Selection", phase: "Phase 1" },
  { path: "/forgot-password", name: "Password Reset Flow", phase: "Phase 1" },

  // Phase 2: Course Catalog & Discovery
  { path: "/courses", name: "Course Catalog & Search Filters", phase: "Phase 2" },
  { path: "/courses/category/web-development", name: "Category: Web Development", phase: "Phase 2" },
  { path: "/courses/full-stack-nextjs-15-ai-apps-mastery", name: "Course Detail Page", phase: "Phase 2" },

  // Phase 3: Course Builder & Payments
  { path: "/trainer/courses", name: "Trainer Courses Dashboard", phase: "Phase 3" },
  { path: "/trainer/courses/new", name: "Trainer Course Wizard (New)", phase: "Phase 3" },
  { path: "/admin/revenue", name: "Admin Revenue & Analytics", phase: "Phase 3" },
  { path: "/admin/coupons", name: "Admin Coupon Management", phase: "Phase 3" },
  { path: "/admin/payments", name: "Admin Payments & Refunds", phase: "Phase 3" },
  { path: "/checkout/full-stack-nextjs-15-ai-apps-mastery", name: "Razorpay Checkout Page", phase: "Phase 3" },
  { path: "/checkout/success", name: "Checkout Success Screen", phase: "Phase 3" },
  { path: "/checkout/failure", name: "Checkout Failure Screen", phase: "Phase 3" },

  // Phase 4: Learning Player, Quizzes, Certificates & Reviews
  { path: "/learn/full-stack-nextjs-15-ai-apps-mastery", name: "Course Learning Hub", phase: "Phase 4" },
  { path: "/learn/full-stack-nextjs-15-ai-apps-mastery/lesson_nextjs_intro", name: "Video Learning Player", phase: "Phase 4" },
  { path: "/learn/full-stack-nextjs-15-ai-apps-mastery/quiz/quiz_nextjs_basics", name: "Quiz Assessment Player", phase: "Phase 4" },
  { path: "/learn/full-stack-nextjs-15-ai-apps-mastery/assignment/assignment_capstone_fullstack", name: "Assignment Submission Portal", phase: "Phase 4" },
  { path: "/verify/GZN-2026-A1B2C3D4", name: "Public Certificate Verification", phase: "Phase 4" },
  { path: "/student/certificates", name: "Student Certificates Vault", phase: "Phase 4" },
  { path: "/trainer/submissions", name: "Trainer Submissions Grading Desk", phase: "Phase 4" },

  // Phase 5: Student Training Module (Cohorts, Batches, Live Sessions, Projects, Placements)
  { path: "/programs", name: "Training Programs Catalog", phase: "Phase 5" },
  { path: "/student/training", name: "Student Cohort Training Hub", phase: "Phase 5" },
  { path: "/student/schedule", name: "Live Sessions Schedule Calendar", phase: "Phase 5" },
  { path: "/student/interviews", name: "Mock Interviews Booking & Feedback", phase: "Phase 5" },
  { path: "/student/placement/resume", name: "Student Placement Profile & Resume", phase: "Phase 5" },
  { path: "/trainer/batches", name: "Trainer Cohort Batches Desk", phase: "Phase 5" },
  { path: "/jobs", name: "Placement Job Board", phase: "Phase 5" },
  { path: "/admin", name: "Admin Master Control Panel", phase: "Phase 5" },
];

async function verifyAllRoutes() {
  console.log("================================================================================");
  console.log("🌐 GENZNEX COMPLETE APPLICATION ROUTE VERIFICATION (PHASES 1 TO 5)");
  console.log("================================================================================\n");

  const baseUrl = "http://localhost:3000";
  let passedCount = 0;
  let failedCount = 0;

  for (const route of routesToTest) {
    const url = `${baseUrl}${route.path}`;
    const start = Date.now();
    try {
      const res = await fetch(url, { headers: { "User-Agent": "GenZNex-Route-Checker" } });
      const elapsed = Date.now() - start;
      const status = res.status;
      const isOk = status === 200 || (route.expectedStatus && status === route.expectedStatus);

      if (isOk) {
        passedCount++;
        console.log(`✅ [${route.phase}] ${route.name}`);
        console.log(`   URL: ${route.path} -> HTTP ${status} (${elapsed}ms)`);
      } else {
        failedCount++;
        console.log(`❌ [${route.phase}] ${route.name}`);
        console.log(`   URL: ${route.path} -> HTTP ${status} (${elapsed}ms)`);
      }
    } catch (err: any) {
      failedCount++;
      console.log(`❌ [${route.phase}] ${route.name}`);
      console.log(`   URL: ${route.path} -> Error: ${err.message}`);
    }
  }

  console.log("\n================================================================================");
  console.log(`🏁 ROUTE AUDIT RESULT: ${passedCount}/${routesToTest.length} Routes Accessible (200 OK)`);
  if (failedCount === 0) {
    console.log("🎉 ALL ROUTES ACROSS PHASE 1 TO PHASE 5 ARE FULLY OPERATIONAL!");
  } else {
    console.log(`⚠️ ${failedCount} routes need attention.`);
  }
  console.log("================================================================================\n");
}

verifyAllRoutes().catch(console.error);
