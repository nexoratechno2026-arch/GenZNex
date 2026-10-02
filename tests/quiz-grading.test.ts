/**
 * GenZNex Phase 4: Quiz Grading & Assessment Logic Unit Tests
 */

interface QuestionGradingRule {
  correctIndices?: number[];
  correctBoolean?: boolean;
  correctText?: string;
  keywords?: string[];
  isCaseSensitive?: boolean;
}

interface GradeResult {
  isCorrect: boolean;
  earned: number;
}

export function gradeQuestion(
  type: "mcq_single" | "mcq_multi" | "true_false" | "short_answer",
  maxPoints: number,
  studentAnswer: any,
  rule: QuestionGradingRule
): GradeResult {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
    return { isCorrect: false, earned: 0 };
  }

  let isCorrect = false;

  switch (type) {
    case "mcq_single": {
      const expected = rule.correctIndices?.[0];
      isCorrect = expected !== undefined && Number(studentAnswer) === Number(expected);
      break;
    }

    case "mcq_multi": {
      const expected = (rule.correctIndices || []).map(Number).sort();
      const actual = (Array.isArray(studentAnswer) ? studentAnswer : []).map(Number).sort();
      isCorrect =
        expected.length === actual.length &&
        expected.every((val, idx) => val === actual[idx]);
      break;
    }

    case "true_false": {
      isCorrect = Boolean(studentAnswer) === Boolean(rule.correctBoolean);
      break;
    }

    case "short_answer": {
      const text = String(studentAnswer).trim();
      if (rule.keywords && rule.keywords.length > 0) {
        // Keyword match: must contain at least one of the specified key terms
        const normalized = rule.isCaseSensitive ? text : text.toLowerCase();
        isCorrect = rule.keywords.some((kw) =>
          normalized.includes(rule.isCaseSensitive ? kw : kw.toLowerCase())
        );
      } else if (rule.correctText) {
        // Exact match
        if (rule.isCaseSensitive) {
          isCorrect = text === rule.correctText.trim();
        } else {
          isCorrect = text.toLowerCase() === rule.correctText.trim().toLowerCase();
        }
      }
      break;
    }
  }

  return {
    isCorrect,
    earned: isCorrect ? maxPoints : 0,
  };
}

export function checkTimeLimit(
  startedAtMs: number,
  timeLimitMinutes: number,
  submittedAtMs: number,
  gracePeriodSeconds: number = 30
): { isTimedOut: boolean; elapsedSeconds: number } {
  const elapsedSeconds = (submittedAtMs - startedAtMs) / 1000;
  const allowedSeconds = timeLimitMinutes * 60 + gracePeriodSeconds;
  return {
    isTimedOut: elapsedSeconds > allowedSeconds,
    elapsedSeconds,
  };
}

export function checkAttemptLimit(
  existingCompletedAttempts: number,
  maxAttempts?: number
): boolean {
  if (!maxAttempts || maxAttempts <= 0) return true; // unlimited
  return existingCompletedAttempts < maxAttempts;
}

// ---------------------------------------------------------------------------
// TEST RUNNER
// ---------------------------------------------------------------------------
function runQuizGradingTests() {
  console.log("================================================================================");
  console.log("🧠 GENZNEX PHASE 4: QUIZ GRADING & ASSESSMENT LOGIC UNIT TESTS");
  console.log("================================================================================\n");

  // Test 1: MCQ Single Choice
  console.log("🧪 Test 1: Single-Choice MCQ Grading");
  const res1A = gradeQuestion("mcq_single", 2, 2, { correctIndices: [2] });
  if (!res1A.isCorrect || res1A.earned !== 2) throw new Error("MCQ Single correct option failed");

  const res1B = gradeQuestion("mcq_single", 2, 1, { correctIndices: [2] });
  if (res1B.isCorrect || res1B.earned !== 0) throw new Error("MCQ Single incorrect option should earn 0");
  console.log("   ✅ PASS: Single-choice MCQ exact index validation.");

  // Test 2: MCQ Multi-Select (All or nothing)
  console.log("\n🧪 Test 2: Multi-Select MCQ Grading");
  const res2A = gradeQuestion("mcq_multi", 3, [0, 2], { correctIndices: [2, 0] });
  if (!res2A.isCorrect || res2A.earned !== 3) throw new Error("MCQ Multi unordered match failed");

  const res2B = gradeQuestion("mcq_multi", 3, [0], { correctIndices: [0, 2] });
  if (res2B.isCorrect || res2B.earned !== 0) throw new Error("MCQ Multi incomplete should be incorrect");

  const res2C = gradeQuestion("mcq_multi", 3, [0, 1, 2], { correctIndices: [0, 2] });
  if (res2C.isCorrect || res2C.earned !== 0) throw new Error("MCQ Multi extra incorrect option should be incorrect");
  console.log("   ✅ PASS: Multi-select MCQ set-equality validation.");

  // Test 3: True / False
  console.log("\n🧪 Test 3: True / False Grading");
  const res3A = gradeQuestion("true_false", 1, true, { correctBoolean: true });
  if (!res3A.isCorrect || res3A.earned !== 1) throw new Error("True/false true failed");

  const res3B = gradeQuestion("true_false", 1, false, { correctBoolean: true });
  if (res3B.isCorrect || res3B.earned !== 0) throw new Error("True/false false should earn 0");
  console.log("   ✅ PASS: True / False boolean match validation.");

  // Test 4: Short Answer (Exact Match, Case-Insensitive)
  console.log("\n🧪 Test 4: Short Answer Exact Match");
  const res4A = gradeQuestion("short_answer", 5, " Next.js ", { correctText: "next.js" });
  if (!res4A.isCorrect || res4A.earned !== 5) throw new Error("Short answer case-insensitive match failed");

  const res4B = gradeQuestion("short_answer", 5, "React", { correctText: "next.js" });
  if (res4B.isCorrect || res4B.earned !== 0) throw new Error("Short answer mismatch should fail");
  console.log("   ✅ PASS: Short answer case-insensitive and trimmed match validation.");

  // Test 5: Short Answer (Keyword Match)
  console.log("\n🧪 Test 5: Short Answer Keyword Matching");
  const res5A = gradeQuestion("short_answer", 4, "It uses atomic transactions in Firestore", {
    keywords: ["atomic transaction", "transaction"],
  });
  if (!res5A.isCorrect || res5A.earned !== 4) throw new Error("Keyword search match failed");

  const res5B = gradeQuestion("short_answer", 4, "It writes directly from the client", {
    keywords: ["atomic transaction", "transaction"],
  });
  if (res5B.isCorrect || res5B.earned !== 0) throw new Error("Keyword mismatch should fail");
  console.log("   ✅ PASS: Keyword semantic inclusion validation.");

  // Test 6: Time Limit Enforcement with Grace Period
  console.log("\n🧪 Test 6: Time Limit & Network Grace Period");
  const start = 1000000;
  // 15 min limit = 900 seconds. Allowed = 930 seconds.
  const withinLimit = checkTimeLimit(start, 15, start + 910 * 1000, 30);
  if (withinLimit.isTimedOut) throw new Error("Within limit + grace period was flagged as timed out");

  const timedOut = checkTimeLimit(start, 15, start + 940 * 1000, 30);
  if (!timedOut.isTimedOut) throw new Error("Exceeded limit was not flagged as timed out");
  console.log("   ✅ PASS: Server-side time limit + 30s grace period enforcement.");

  // Test 7: Max Attempt Limit
  console.log("\n🧪 Test 7: Quiz Attempt Limits");
  if (!checkAttemptLimit(0, 3)) throw new Error("0 of 3 attempts should be allowed");
  if (!checkAttemptLimit(2, 3)) throw new Error("2 of 3 attempts should be allowed");
  if (checkAttemptLimit(3, 3)) throw new Error("3 of 3 attempts should be blocked");
  if (!checkAttemptLimit(100, 0)) throw new Error("Unlimited attempts (0) should always pass");
  console.log("   ✅ PASS: Maximum attempt limit constraints verified.");

  console.log("\n================================================================================");
  console.log("🎉 ALL 7 QUIZ GRADING & ASSESSMENT TESTS PASSED 100%!");
  console.log("================================================================================\n");
}

runQuizGradingTests();
