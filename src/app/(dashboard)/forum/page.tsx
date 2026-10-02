"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  CheckCircle2, 
  Award, 
  Pin, 
  Lock, 
  Search, 
  Filter, 
  Send,
  Flag,
  UserCheck
} from "lucide-react";
import type { ForumPostDoc, ForumReplyDoc } from "@/types/schema";

export default function ForumPage() {
  const { user, role } = useAuth();
  const [posts, setPosts] = useState<ForumPostDoc[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPostDoc | null>(null);
  const [replies, setReplies] = useState<ForumReplyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // New Post Modal State
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("nextjs15, react19");
  const [submittingPost, setSubmittingPost] = useState(false);

  // New Reply State
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadForumPosts();
  }, []);

  async function loadForumPosts() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "forum_posts"),
        where("status", "==", "active"),
        orderBy("lastActivityAt", "desc")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumPostDoc)));
      } else {
        // Fallback mock posts
        const mockPosts: ForumPostDoc[] = [
          {
            id: "fp_1",
            scopeType: "course",
            scopeId: "course_nextjs_fullstack",
            authorId: "student_rahul_01",
            authorName: "Rahul Sharma",
            authorRole: "student",
            authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64",
            title: "How to handle Server Action optimistic updates with React 19 useActionState?",
            content: "When combining useActionState with useOptimistic for real-time item deletion, what is the cleanest approach to roll back if the Cloud Function returns a 409 conflict?",
            tags: ["nextjs15", "react19", "server-actions"],
            imageUrls: [],
            replyCount: 2,
            upvoteCount: 5,
            isResolved: true,
            hasAcceptedAnswer: true,
            acceptedReplyId: "rep_1",
            isPinned: true,
            isLocked: false,
            status: "active",
            reportCount: 0,
            lastActivityAt: null,
            createdAt: null,
            updatedAt: null,
          },
          {
            id: "fp_2",
            scopeType: "course",
            scopeId: "course_nextjs_fullstack",
            authorId: "student_completed_01",
            authorName: "Aarav Patel",
            authorRole: "student",
            authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64",
            title: "Best practices for testing Firestore Security Rules with @firebase/rules-unit-testing",
            content: "Is it better to use testEnv.authenticatedContext or pass custom tokens directly when asserting that students cannot update isRead to unauthorized fields?",
            tags: ["firestore", "security-rules", "testing"],
            imageUrls: [],
            replyCount: 1,
            upvoteCount: 3,
            isResolved: false,
            hasAcceptedAnswer: false,
            isPinned: false,
            isLocked: false,
            status: "active",
            reportCount: 0,
            lastActivityAt: null,
            createdAt: null,
            updatedAt: null,
          }
        ];
        setPosts(mockPosts);
      }
    } catch (err) {
      console.error("Failed to load forum posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRepliesForPost(postId: string) {
    setRepliesLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "forum_posts", postId, "replies"),
          where("status", "==", "active"),
          orderBy("createdAt", "asc")
        )
      );
      if (!snap.empty) {
        setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumReplyDoc)));
      } else {
        setReplies([
          {
            id: "rep_1",
            postId,
            authorId: "trainer_vikram_01",
            authorName: "Vikram Malhotra",
            authorRole: "trainer",
            authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64",
            content: "Great question! With useActionState, pass the previous state into the action reducer. If the response indicates failure, useOptimistic automatically reverts when the transition completes.",
            isAccepted: true,
            isInstructorAnswer: true,
            upvoteCount: 4,
            status: "active",
            createdAt: null,
            updatedAt: null,
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setRepliesLoading(false);
    }
  }

  const handleSelectPost = (post: ForumPostDoc) => {
    setSelectedPost(post);
    loadRepliesForPost(post.id);
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmittingPost(true);
    try {
      const createPostFn = httpsCallable(functions, "createForumPost");
      const tagsArray = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      await createPostFn({
        scopeType: "course",
        scopeId: "course_nextjs_fullstack",
        title: newTitle,
        content: newContent,
        tags: tagsArray,
      });

      setShowNewPostModal(false);
      setNewTitle("");
      setNewContent("");
      loadForumPosts();
    } catch (err: any) {
      alert(`Error creating post: ${err.message}`);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleAddReply = async () => {
    if (!selectedPost || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const createReplyFn = httpsCallable(functions, "createForumReply");
      await createReplyFn({
        postId: selectedPost.id,
        content: replyContent,
      });
      setReplyContent("");
      loadRepliesForPost(selectedPost.id);
    } catch (err: any) {
      alert(`Error adding reply: ${err.message}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpvote = async (targetType: "post" | "reply", targetId: string) => {
    try {
      const toggleVoteFn = httpsCallable(functions, "toggleForumVote");
      await toggleVoteFn({
        targetType,
        targetId,
        parentPostId: selectedPost?.id,
      });

      if (targetType === "post" && selectedPost) {
        setSelectedPost((prev) => prev ? { ...prev, upvoteCount: prev.upvoteCount + 1 } : null);
      } else if (targetType === "reply") {
        setReplies((prev) => prev.map((r) => r.id === targetId ? { ...r, upvoteCount: r.upvoteCount + 1 } : r));
      }
    } catch (err: any) {
      console.error("Upvote failed:", err);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    if (!selectedPost) return;
    try {
      const acceptFn = httpsCallable(functions, "acceptForumAnswer");
      await acceptFn({
        postId: selectedPost.id,
        replyId,
      });
      setReplies((prev) => prev.map((r) => ({ ...r, isAccepted: r.id === replyId })));
      setSelectedPost((prev) => prev ? { ...prev, hasAcceptedAnswer: true, isResolved: true } : null);
    } catch (err: any) {
      alert(`Error accepting answer: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-400" />
            Doubt Clearing &amp; Discussion Forum
          </h1>
          <p className="text-gray-400 mt-1">
            Enrolled course and cohort doubts answered by peers and industry trainers.
          </p>
        </div>

        <button
          onClick={() => setShowNewPostModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ask a Doubt
        </button>
      </div>

      {/* Main Layout: Split list & thread viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Posts List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doubts by title or tag..."
              className="w-full bg-[#12131f] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading discussions...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-8 text-center bg-[#12131f] border border-gray-800 rounded-xl text-gray-400 text-sm">
              No matching doubts found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPosts.map((post) => {
                const isSelected = selectedPost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#18192c] border-purple-500/80 shadow-md shadow-purple-500/10"
                        : "bg-[#12131f] border-gray-800/80 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-400">
                      {post.isPinned && <Pin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />}
                      <span className="font-semibold text-white truncate">{post.authorName}</span>
                      <span>•</span>
                      <span className="capitalize text-purple-400">{post.scopeType}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-gray-400" />
                          {post.upvoteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-gray-400" />
                          {post.replyCount}
                        </span>
                      </div>

                      {post.hasAcceptedAnswer && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Thread View */}
        <div className="lg:col-span-7 bg-[#12131f] border border-gray-800 rounded-2xl p-6 min-h-[500px]">
          {selectedPost ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="border-b border-gray-800 pb-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
                      <img src={selectedPost.authorAvatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64"} alt={selectedPost.authorName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{selectedPost.authorName}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{selectedPost.authorRole}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpvote("post", selectedPost.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-800/80 border border-gray-700 text-gray-300 hover:text-white"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-purple-400" />
                      <span>{selectedPost.upvoteCount} Upvotes</span>
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white mt-3">{selectedPost.title}</h2>
                <div className="text-sm text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </div>

                {selectedPost.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Replies Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Replies ({replies.length})
                </h3>

                {repliesLoading ? (
                  <div className="text-xs text-gray-400">Loading replies...</div>
                ) : replies.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-center text-xs text-gray-400">
                    No replies yet. Be the first to answer this doubt!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-xl border ${
                          reply.isAccepted
                            ? "bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/5"
                            : "bg-gray-900/50 border-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{reply.authorName}</span>
                            {reply.isInstructorAnswer && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                                <UserCheck className="w-3 h-3" />
                                Instructor
                              </span>
                            )}
                            {reply.isAccepted && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                Accepted Solution (+75 XP)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpvote("reply", reply.id)}
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              {reply.upvoteCount}
                            </button>

                            {/* Mark Accepted Button (Only for Question Author or Trainer) */}
                            {!reply.isAccepted && (user?.uid === selectedPost.authorId || role === "trainer") && (
                              <button
                                onClick={() => handleAcceptAnswer(reply.id)}
                                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                              >
                                Accept Answer
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Reply Input */}
                <div className="pt-3 border-t border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a clear, helpful reply..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleAddReply}
                    disabled={submittingReply || !replyContent.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-20">
              <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
              <h3 className="text-base font-bold text-gray-300">Select a discussion thread</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Choose a doubt from the left column to read replies or write a verified solution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ask Doubt Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12131f] border border-gray-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Ask a Doubt to Your Batch &amp; Mentors</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Doubt Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Next.js 15 Streaming SSR hydration error in parallel routes"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Details &amp; Code Snippets</label>
              <textarea
                rows={5}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Explain what you tried, the exact error code, and expected behavior..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={submittingPost}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50"
              >
                {submittingPost ? "Submitting..." : "Post Doubt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
