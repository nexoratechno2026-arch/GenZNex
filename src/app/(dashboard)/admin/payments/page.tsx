"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Eye,
  X,
  Loader2,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getFirebaseFirestore, getFirebaseFunctions } from "@/lib/firebase/client";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { PaymentDoc } from "@/types/schema";

export default function AdminPaymentsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Detail Drawer state
  const [selectedPayment, setSelectedPayment] = useState<PaymentDoc | null>(null);

  // Refund modal state
  const [refundModalPayment, setRefundModalPayment] = useState<PaymentDoc | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllPayments() {
      try {
        setLoading(true);
        const db = getFirebaseFirestore();
        const q = query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        const list: PaymentDoc[] = [];
        snap.forEach((d) => list.push(d.data() as PaymentDoc));
        setPayments(list);
        setFilteredPayments(list);
      } catch (err: unknown) {
        console.error("Error loading payments:", err);
        setError(err instanceof Error ? err.message : "Failed to load payments");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadAllPayments();
    }
  }, [authLoading]);

  // Apply filters
  useEffect(() => {
    let result = [...payments];

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.orderId?.toLowerCase().includes(q) ||
          p.paymentId?.toLowerCase().includes(q) ||
          p.userEmail?.toLowerCase().includes(q) ||
          p.userName?.toLowerCase().includes(q) ||
          p.courseTitle?.toLowerCase().includes(q)
      );
    }

    setFilteredPayments(result);
  }, [payments, statusFilter, searchQuery]);

  // Handle Admin Refund Execution
  const handleAdminRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalPayment || !refundModalPayment.paymentId) return;

    setIsRefunding(true);
    setRefundError(null);
    setRefundSuccess(null);

    try {
      const functions = getFirebaseFunctions();
      const refundFn = httpsCallable<
        { paymentId: string; reason: string },
        { success: boolean; refundId: string; status: string }
      >(functions, "requestRefund");

      const res = await refundFn({
        paymentId: refundModalPayment.paymentId,
        reason: refundReason.trim(),
      });

      if (res.data.success) {
        setRefundSuccess("Refund processed and course access revoked.");
        setPayments((prev) =>
          prev.map((p) =>
            p.orderId === refundModalPayment.orderId ? { ...p, status: "refunded" } : p
          )
        );
        setTimeout(() => {
          setRefundModalPayment(null);
          setRefundReason("");
          setRefundSuccess(null);
        }, 1500);
      }
    } catch (err: unknown) {
      setRefundError(err instanceof Error ? err.message : "Refund execution failed");
    } finally {
      setIsRefunding(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
        <p className="text-sm">Loading all payment records...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-violet-400" />
            <span>Payments Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-trust transaction auditing, Razorpay payment verification, and administrator refund controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/revenue"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
          >
            Revenue Analytics
          </Link>
          <Link
            href="/admin/coupons"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Manage Coupons</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Order ID, Payment ID, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses ({payments.length})</option>
            <option value="captured">Captured</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
            <option value="created">Pending / Created</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Order ID & Date</th>
              <th className="py-3.5 px-4 font-semibold">Learner</th>
              <th className="py-3.5 px-4 font-semibold">Course Title</th>
              <th className="py-3.5 px-4 font-semibold">Amount (Base + GST)</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  No payment records found matching the filters.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-zinc-200 font-semibold text-xs">{p.orderId}</div>
                    <div className="text-[11px] text-zinc-500">{formatDate(p.createdAt)}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{p.userName || "Learner"}</div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">{p.userEmail}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-zinc-200 truncate max-w-xs">{p.courseTitle || "Course"}</div>
                    {p.couponCode && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-400 font-semibold text-[10px]">
                        Coupon: {p.couponCode}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    <div>{p.amountInPaise === 0 ? "FREE" : formatPrice(p.amountInPaise)}</div>
                    {p.amountBreakdown?.gstInPaise ? (
                      <div className="text-[10px] text-zinc-500 font-normal">
                        GST: {formatPrice(p.amountBreakdown.gstInPaise)}
                      </div>
                    ) : null}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {p.status === "captured" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-3 w-3" />
                        <span>Captured</span>
                      </span>
                    )}
                    {p.status === "refunded" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <RotateCcw className="h-3 w-3" />
                        <span>Refunded</span>
                      </span>
                    )}
                    {p.status === "failed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                    {p.status === "created" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {p.status === "captured" && (
                        <a
                          href={`/api/invoices/download?id=inv_${p.orderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {p.status === "captured" && p.paymentId && (
                        <button
                          onClick={() => setRefundModalPayment(p)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Details Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-violet-400" />
                <span>Transaction Breakdown</span>
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 text-[10px]">ORDER ID</span>
                  <p className="font-mono text-white text-[11px] truncate">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">PAYMENT ID</span>
                  <p className="font-mono text-white text-[11px] truncate">{selectedPayment.paymentId || "N/A"}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">LEARNER</span>
                  <p className="text-white text-xs">{selectedPayment.userName || "Student"}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">PAYMENT METHOD</span>
                  <p className="text-white text-xs uppercase">{selectedPayment.method || "card"}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                <span className="text-zinc-500 text-[10px] font-semibold uppercase">Pricing Breakdown</span>
                <div className="flex justify-between text-zinc-300">
                  <span>Base Course Price:</span>
                  <span>{formatPrice(selectedPayment.amountBreakdown?.basePriceInPaise || selectedPayment.amountInPaise)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount:</span>
                  <span>-{formatPrice(selectedPayment.amountBreakdown?.discountInPaise || 0)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Taxable Amount:</span>
                  <span>{formatPrice(selectedPayment.amountBreakdown?.taxableAmountInPaise || selectedPayment.amountInPaise)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>GST (18%):</span>
                  <span>{formatPrice(selectedPayment.amountBreakdown?.gstInPaise || 0)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="text-violet-400">{formatPrice(selectedPayment.amountInPaise)}</span>
                </div>
              </div>

              {selectedPayment.failureReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <span className="font-bold">Failure Reason:</span> {selectedPayment.failureReason}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Refund Confirmation Modal */}
      {refundModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Administrator Refund Action</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Issue an immediate Razorpay gateway refund for order <strong className="text-white">{refundModalPayment.orderId}</strong> (Amount:{" "}
              {formatPrice(refundModalPayment.amountInPaise)}). This will automatically revoke student enrollment and record an audit log entry.
            </p>

            <form onSubmit={handleAdminRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Administrative Reason (Audit Log):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Student requested cancellation via support ticket #102..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {refundError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {refundError}
                </p>
              )}

              {refundSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {refundSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => setRefundModalPayment(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding || refundReason.trim().length < 3}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isRefunding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Refunding...</span>
                    </>
                  ) : (
                    <span>Confirm Refund</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
