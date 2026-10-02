/**
 * GenZNex Phase 6: Discussion Forum & Doubt Clearing
 * Scoped to enrolled courses and training batches. Threaded replies,
 * deterministic upvoting, accepted answers with XP award, and moderation.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { awardXp } from "./gamification";
import { notify } from "./notifications";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// Basic profanity / spam blacklist filter
const BANNED_WORDS = ["scam", "cheat", "hack_account", "free_robux", "crypto_pump", "pirate_link"];

export function containsProfanityOrSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
}

// ---------------------------------------------------------------------------
// Authorization Helper: Verify Course / Batch Enrollment
// ---------------------------------------------------------------------------

export async function verifyUserForumAccess(
  userId: string,
  userRole: string,
  scopeType: "course" | "batch",
  scopeId: string
): Promise<boolean> {
  // Admins and trainers have access to assist students and answer doubts
  if (userRole === "admin" || userRole === "trainer") return true;

  if (scopeType === "course") {
    // Check if user is trainer of this course
    const courseSnap = await db.collection("courses").doc(scopeId).get();
    if (courseSnap.exists && (courseSnap.data()?.trainerId === userId || courseSnap.data()?.instructor?.uid === userId)) {
      return true;
    }

    // Check if student has active enrollment
    const enrollSnap = await db.collection("enrollments").doc(`${userId}_${scopeId}`).get();
    return enrollSnap.exists && enrollSnap.data()?.status === "active";
  } else if (scopeType === "batch") {
    // Check if trainer of this batch
    const batchSnap = await db.collection("program_batches").doc(scopeId).get();
    if (batchSnap.exists) {
      const trainers: string[] = batchSnap.data()?.trainerIds || [];
      if (trainers.includes(userId)) return true;
    }

    // Check if student enrolled in batch
    const batchEnrollSnap = await db.collection("batch_enrollments").doc(`${scopeId}_${userId}`).get();
    return batchEnrollSnap.exists && batchEnrollSnap.data()?.status === "active";
  }

  return false;
}

// ---------------------------------------------------------------------------
// Callable Functions
// ---------------------------------------------------------------------------

/**
 * Create a new Question or Discussion Post
 */
export const createForumPost = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const schema = z.object({
    scopeType: z.enum(["course", "batch"]),
    scopeId: z.string().min(1),
    title: z.string().min(5).max(200),
    content: z.string().min(10),
    tags: z.array(z.string()).default([]),
    imageUrls: z.array(z.string().url()).default([]),
    lessonId: z.string().optional(),
    videoTimestampSeconds: z.number().int().min(0).optional(),
  });

  const data = schema.parse(request.data);
  const userId = request.auth.uid;
  const userRole = request.auth.token.role || "student";

  // Check enrollment permission
  const hasAccess = await verifyUserForumAccess(userId, userRole, data.scopeType, data.scopeId);
  if (!hasAccess) {
    throw new HttpsError("permission-denied", "You must be enrolled in this course/batch to participate in discussions.");
  }

  // Spam check
  if (containsProfanityOrSpam(data.title) || containsProfanityOrSpam(data.content)) {
    throw new HttpsError("invalid-argument", "Your post contains prohibited or suspicious content.");
  }

  // Rate limit: max 5 posts per hour
  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const recentSnap = await db.collection("forum_posts")
    .where("authorId", "==", userId)
    .where("createdAt", ">", oneHourAgo)
    .get();

  if (recentSnap.size >= 5 && userRole === "student") {
    throw new HttpsError("resource-exhausted", "You are posting too quickly. Maximum 5 questions per hour.");
  }

  // Fetch author profile
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() || {};

  const postRef = db.collection("forum_posts").doc();
  const postData = {
    id: postRef.id,
    scopeType: data.scopeType,
    scopeId: data.scopeId,
    lessonId: data.lessonId || null,
    videoTimestampSeconds: data.videoTimestampSeconds || null,
    authorId: userId,
    authorName: userData.displayName || "GenZNex Learner",
    authorRole: userRole,
    authorAvatar: userData.photoURL || null,
    title: data.title,
    content: data.content,
    tags: data.tags,
    imageUrls: data.imageUrls,
    replyCount: 0,
    upvoteCount: 0,
    isResolved: false,
    hasAcceptedAnswer: false,
    isPinned: false,
    isLocked: false,
    status: "active",
    reportCount: 0,
    lastActivityAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await postRef.set(postData);

  // Award XP for posting a thoughtful question (first question of day)
  await awardXp(userId, "daily_login", `forum_post_${postRef.id}`, { postId: postRef.id });

  return { success: true, postId: postRef.id };
});

/**
 * Add a Threaded Reply to a Question
 */
export const createForumReply = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const schema = z.object({
    postId: z.string().min(1),
    content: z.string().min(3),
  });

  const { postId, content } = schema.parse(request.data);
  const userId = request.auth.uid;
  const userRole = request.auth.token.role || "student";

  const postRef = db.collection("forum_posts").doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) throw new HttpsError("not-found", "Discussion post not found.");

  const postData = postSnap.data()!;
  if (postData.isLocked) throw new HttpsError("failed-precondition", "This thread is locked by a moderator.");

  // Verify access
  const hasAccess = await verifyUserForumAccess(userId, userRole, postData.scopeType, postData.scopeId);
  if (!hasAccess) throw new HttpsError("permission-denied", "Not enrolled in this course/batch.");

  // Check spam
  if (containsProfanityOrSpam(content)) {
    throw new HttpsError("invalid-argument", "Your reply contains prohibited or suspicious content.");
  }

  // Fetch author
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() || {};
  const isInstructor = userRole === "trainer" || userRole === "admin";

  const replyRef = postRef.collection("replies").doc();
  const replyData = {
    id: replyRef.id,
    postId,
    authorId: userId,
    authorName: userData.displayName || "GenZNex Learner",
    authorRole: userRole,
    authorAvatar: userData.photoURL || null,
    content,
    isAccepted: false,
    isInstructorAnswer: isInstructor,
    upvoteCount: 0,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await replyRef.set(replyData);

  // Update parent post reply count & last activity
  await postRef.update({
    replyCount: FieldValue.increment(1),
    lastActivityAt: FieldValue.serverTimestamp(),
  });

  // Notify question author if different user
  if (postData.authorId !== userId) {
    await notify({
      userId: postData.authorId,
      type: "forum_reply",
      title: "New Reply to Your Doubt",
      body: `${userData.displayName || "A classmate"} replied to: "${postData.title.substring(0, 40)}..."`,
      linkUrl: `/learn/${postData.scopeId}#forum`,
    });
  }

  return { success: true, replyId: replyRef.id };
});

/**
 * Toggle Upvote on Post or Reply (Deterministic 1 vote per user)
 */
export const toggleForumVote = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const schema = z.object({
    targetType: z.enum(["post", "reply"]),
    targetId: z.string().min(1),
    parentPostId: z.string().optional(), // Required if targetType is 'reply'
  });

  const { targetType, targetId, parentPostId } = schema.parse(request.data);
  const userId = request.auth.uid;
  const voteDocId = `${userId}_${targetType}_${targetId}`;
  const voteRef = db.collection("forum_votes").doc(voteDocId);

  const targetRef = targetType === "post"
    ? db.collection("forum_posts").doc(targetId)
    : db.collection("forum_posts").doc(parentPostId!).collection("replies").doc(targetId);

  return await db.runTransaction(async (tx) => {
    const voteSnap = await tx.get(voteRef);
    const hasVoted = voteSnap.exists;

    if (hasVoted) {
      // Remove upvote
      tx.delete(voteRef);
      tx.update(targetRef, { upvoteCount: FieldValue.increment(-1) });
      return { upvoted: false };
    } else {
      // Add upvote
      tx.set(voteRef, {
        id: voteDocId,
        userId,
        targetType,
        targetId,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(targetRef, { upvoteCount: FieldValue.increment(1) });
      return { upvoted: true };
    }
  });
});

/**
 * Mark Answer as Accepted (Question author or Trainer only) -> Awards XP!
 */
export const acceptForumAnswer = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const schema = z.object({
    postId: z.string().min(1),
    replyId: z.string().min(1),
  });

  const { postId, replyId } = schema.parse(request.data);
  const userId = request.auth.uid;
  const userRole = request.auth.token.role || "student";

  const postRef = db.collection("forum_posts").doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) throw new HttpsError("not-found", "Post not found.");

  const postData = postSnap.data()!;
  const isAuthor = postData.authorId === userId;
  const isTrainerOrAdmin = userRole === "trainer" || userRole === "admin";

  if (!isAuthor && !isTrainerOrAdmin) {
    throw new HttpsError("permission-denied", "Only the question author or a trainer can mark an answer as accepted.");
  }

  const replyRef = postRef.collection("replies").doc(replyId);
  const replySnap = await replyRef.get();
  if (!replySnap.exists) throw new HttpsError("not-found", "Reply not found.");

  const replyData = replySnap.data()!;

  // Update reply and post
  await replyRef.update({ isAccepted: true });
  await postRef.update({
    hasAcceptedAnswer: true,
    acceptedReplyId: replyId,
    isResolved: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Award 75 XP to reply author for solving the doubt!
  await awardXp(replyData.authorId, "forum_answer_accepted", replyId, {
    postId,
    acceptedBy: userId,
  });

  // Notify reply author
  await notify({
    userId: replyData.authorId,
    type: "forum_accepted",
    title: "Answer Accepted! +75 XP",
    body: `Your answer was marked as the accepted solution for: "${postData.title.substring(0, 35)}..."`,
    linkUrl: `/learn/${postData.scopeId}#forum`,
  });

  return { success: true, replyId };
});

/**
 * Report Content for Moderation
 */
export const reportForumContent = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const schema = z.object({
    targetType: z.enum(["post", "reply"]),
    targetId: z.string().min(1),
    postId: z.string().min(1),
    reason: z.string().min(5),
  });

  const { targetType, targetId, postId, reason } = schema.parse(request.data);
  const userId = request.auth.uid;

  const reportRef = db.collection("forum_reports").doc();
  await reportRef.set({
    id: reportRef.id,
    reporterId: userId,
    targetType,
    targetId,
    postId,
    reason,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Increment report count on target post
  if (targetType === "post") {
    const postRef = db.collection("forum_posts").doc(postId);
    const postSnap = await postRef.get();
    if (postSnap.exists) {
      const currentReports = (postSnap.data()?.reportCount || 0) + 1;
      const autoHide = currentReports >= 3;
      await postRef.update({
        reportCount: currentReports,
        status: autoHide ? "hidden" : postSnap.data()?.status,
      });
    }
  }

  return { success: true, reportId: reportRef.id };
});

/**
 * Moderator Action (Trainers & Admins)
 */
export const moderateForumContent = onCall(async (request) => {
  if (!request.auth || (request.auth.token.role !== "trainer" && request.auth.token.role !== "admin")) {
    throw new HttpsError("permission-denied", "Only trainers and admins can moderate discussions.");
  }

  const schema = z.object({
    postId: z.string().min(1),
    action: z.enum(["approve", "hide", "lock", "unlock", "pin", "unpin", "delete"]),
  });

  const { postId, action } = schema.parse(request.data);
  const postRef = db.collection("forum_posts").doc(postId);

  const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  if (action === "approve") {
    updates.status = "active";
    updates.reportCount = 0;
  } else if (action === "hide") {
    updates.status = "hidden";
  } else if (action === "lock") {
    updates.isLocked = true;
  } else if (action === "unlock") {
    updates.isLocked = false;
  } else if (action === "pin") {
    updates.isPinned = true;
  } else if (action === "unpin") {
    updates.isPinned = false;
  } else if (action === "delete") {
    updates.status = "deleted";
  }

  await postRef.update(updates);

  // Audit log
  await db.collection("audit_logs").add({
    action: `forum_moderation_${action}`,
    postId,
    moderatorId: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, postId, action };
});
