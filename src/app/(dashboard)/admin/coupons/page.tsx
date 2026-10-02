"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Power,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  X,
  CreditCard,
  Percent,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { CouponDoc, CouponDiscountType } from "@/types/schema";

export default function AdminCouponsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponDiscountType>("percent");
  const [value, setValue] = useState<number>(20);
  const [maxDiscountInRupees, setMaxDiscountInRupees] = useState<string>("");
  const [minOrderInRupees, setMinOrderInRupees] = useState<string>("999");
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [usageLimit, setUsageLimit] = useState<number>(500);
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);
        const db = getFirebaseFirestore();
        const snap = await getDocs(collection(db, "coupons"));
        const list: CouponDoc[] = [];
        snap.forEach((d) => list.push(d.data() as CouponDoc));
        setCoupons(list);
      } catch (err: unknown) {
        console.error("Error loading coupons:", err);
        setError(err instanceof Error ? err.message : "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadCoupons();
    }
  }, [authLoading]);

  // Toggle active status
  const handleToggleActive = async (coupon: CouponDoc) => {
    try {
      const db = getFirebaseFirestore();
      const ref = doc(db, "coupons", coupon.id);
      await updateDoc(ref, {
        isActive: !coupon.isActive,
        updatedAt: Timestamp.now(),
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      console.error("Failed to toggle coupon:", err);
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${couponId}?`)) return;
    try {
      const db = getFirebaseFirestore();
      await deleteDoc(doc(db, "coupons", couponId));
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setFormError(null);

    const normalizedCode = code.trim().toUpperCase();
    const now = Date.now();
    const expiresAtMillis = now + expiryDays * 24 * 60 * 60 * 1000;

    const newCoupon: CouponDoc = {
      id: normalizedCode,
      code: normalizedCode,
      type,
      value: Number(value),
      maxDiscountInPaise: maxDiscountInRupees ? Math.round(Number(maxDiscountInRupees) * 100) : undefined,
      minOrderInPaise: minOrderInRupees ? Math.round(Number(minOrderInRupees) * 100) : 0,
      validityDates: {
        startsAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(expiresAtMillis),
      },
      usageLimit: Number(usageLimit),
      perUserLimit: Number(perUserLimit),
      applicableCourses: [],
      applicableCategories: [],
      isActive: true,
      usedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const db = getFirebaseFirestore();
      await setDoc(doc(db, "coupons", normalizedCode), newCoupon);

      // Audit log entry
      const auditRef = doc(collection(db, "audit_logs"));
      await setDoc(auditRef, {
        id: auditRef.id,
        actorUid: user?.uid || "admin",
        actorEmail: user?.email || "admin@genznex.in",
        actorRole: "admin",
        action: "coupon_create",
        targetId: normalizedCode,
        details: { code: normalizedCode, type, value },
        timestamp: Timestamp.now(),
      });

      setCoupons((prev) => [newCoupon, ...prev.filter((c) => c.id !== normalizedCode)]);
      setIsCreateModalOpen(false);
      setCode("");
      setValue(20);
      setMaxDiscountInRupees("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "No Expiry";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
        <p className="text-sm">Loading discount coupons...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Tag className="h-6 w-6 text-violet-400" />
            <span>Discount Coupons</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create promotional codes, configure percentage or flat discounts, and inspect redemption metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payments</span>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Coupon</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((c) => {
          const isExpired =
            typeof (c.validityDates?.expiresAt as any)?.toMillis === "function"
              ? (c.validityDates.expiresAt as any).toMillis() < Date.now()
              : false;
          const percentUsed = c.usageLimit > 0 ? Math.round(((c.usedCount || 0) / c.usageLimit) * 100) : 0;

          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border transition-all ${
                c.isActive && !isExpired
                  ? "bg-zinc-900/80 border-zinc-800 hover:border-violet-500/40 shadow-xl"
                  : "bg-zinc-950/60 border-zinc-800/60 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono font-bold text-sm tracking-wider">
                    {c.code}
                  </div>
                  {c.isActive && !isExpired ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      {isExpired ? "Expired" : "Inactive"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(c)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      c.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                    }`}
                    title={c.isActive ? "Deactivate" : "Activate"}
                  >
                    <Power className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-zinc-400 mb-4">
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <strong className="text-white">
                    {c.type === "percent" ? `${c.value}% OFF` : `₹${(c.value / 100).toLocaleString("en-IN")} FLAT OFF`}
                    {c.maxDiscountInPaise ? ` (up to ₹${c.maxDiscountInPaise / 100})` : ""}
                  </strong>
                </div>

                {c.minOrderInPaise > 0 && (
                  <div className="flex justify-between">
                    <span>Min Order:</span>
                    <span className="text-zinc-200">₹{(c.minOrderInPaise / 100).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Valid Until:</span>
                  <span className="text-zinc-300">{formatDate(c.validityDates?.expiresAt)}</span>
                </div>
              </div>

              {/* Usage Progress Bar */}
              <div className="space-y-1.5 pt-3 border-t border-zinc-800/80 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Redemptions:</span>
                  <strong className="text-white">
                    {c.usedCount || 0} / {c.usageLimit || "∞"} ({percentUsed}%)
                  </strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-violet-400" />
                <span>Create New Coupon Code</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH30, DIWALI500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase tracking-wider focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CouponDiscountType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Rupee (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    {type === "percent" ? "Discount Percentage (%)" : "Flat Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={type === "percent" ? 100 : 100000}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {type === "percent" && (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Max Discount Cap in ₹ (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500 (Leave empty for uncapped)"
                    value={maxDiscountInRupees}
                    onChange={(e) => setMaxDiscountInRupees(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Min Order in ₹</label>
                  <input
                    type="number"
                    value={minOrderInRupees}
                    onChange={(e) => setMinOrderInRupees(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Total Uses Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
