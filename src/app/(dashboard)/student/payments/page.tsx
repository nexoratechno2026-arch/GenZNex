"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getFirebaseFirestore, getFirebaseFunctions } from "@/lib/firebase/client";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { PaymentDoc, InvoiceDoc } from "@/types/schema";

export default function StudentPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [invoices, setInvoices] = useState<Record<string, InvoiceDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refund modal state
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PaymentDoc | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);
  const [refundErrorMsg, setRefundErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      if (!user) return;
      try {
        setLoading(true);
        const db = getFirebaseFirestore();

        // Query user's payments
        const q = query(
          collection(db, "payments"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        const list: PaymentDoc[] = [];
        snap.forEach((d) => list.push(d.data() as PaymentDoc));
        setPayments(list);

        // Fetch corresponding invoices
        const invMap: Record<string, InvoiceDoc> = {};
        for (const p of list) {
          if (p.status === "captured") {
            try {
              const invSnap = await getDoc(doc(db, "invoices", `inv_${p.orderId}`));
              if (invSnap.exists()) {
                invMap[p.orderId] = invSnap.data() as InvoiceDoc;
              }
            } catch {
              // Ignore individual invoice load errors
            }
          }
        }
        setInvoices(invMap);
      } catch (err: unknown) {
        console.error("Error loading payments:", err);
        setError(err instanceof Error ? err.message : "Failed to load payment history");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadPayments();
    }
  }, [user, authLoading]);

  // Handle student refund request
  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRefund || !selectedPaymentForRefund.paymentId) return;

    setRefundSubmitting(true);
    setRefundErrorMsg(null);
    setRefundSuccessMsg(null);

    try {
      const functions = getFirebaseFunctions();
      const refundFn = httpsCallable<
        { paymentId: string; reason: string },
        { success: boolean; refundId: string; status: string }
      >(functions, "requestRefund");

      const res = await refundFn({
        paymentId: selectedPaymentForRefund.paymentId,
        reason: refundReason.trim(),
      });

      if (res.data.success) {
        setRefundSuccessMsg("Refund requested successfully. Your enrollment access has been updated.");
        // Update local state
        setPayments((prev) =>
          prev.map((p) =>
            p.orderId === selectedPaymentForRefund.orderId ? { ...p, status: "refunded" } : p
          )
        );
        setTimeout(() => {
          setSelectedPaymentForRefund(null);
          setRefundReason("");
          setRefundSuccessMsg(null);
        }, 2000);
      }
    } catch (err: unknown) {
      setRefundErrorMsg(err instanceof Error ? err.message : "Refund request failed");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const isEligibleForRefund = (payment: PaymentDoc): boolean => {
    if (payment.status !== "captured" || !payment.paymentId) return false;
    const createdAtMillis =
      typeof payment.createdAt === "object" && payment.createdAt !== null && "toMillis" in payment.createdAt
        ? (payment.createdAt as { toMillis: () => number }).toMillis()
        : Date.now();
    const daysSince = (Date.now() - createdAtMillis) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
        <p className="text-sm">Loading billing & payment records...</p>
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
            <span>Payments & Invoices</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review your course purchases, download official GST tax invoices, and manage refund requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
          >
            Explore More Courses
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No payment history yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
            When you purchase a course or enroll with a coupon, your orders and GST tax invoices will appear here.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Course & Order ID</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Amount (INR)</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Tax Invoice</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {payments.map((p) => {
                const invoice = invoices[p.orderId];
                const eligibleRefund = isEligibleForRefund(p);

                return (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm truncate max-w-xs sm:max-w-sm">
                        {p.courseTitle || "Course"}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>{p.orderId}</span>
                        {p.couponCode && (
                          <span className="px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-400 font-semibold text-[10px]">
                            {p.couponCode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-zinc-400 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>

                    <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                      {p.amountInPaise === 0 ? "FREE" : formatPrice(p.amountInPaise)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {p.status === "captured" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" />
                          <span>Captured</span>
                        </span>
                      )}
                      {p.status === "refunded" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <RotateCcw className="h-3 w-3" />
                          <span>Refunded</span>
                        </span>
                      )}
                      {p.status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="h-3 w-3" />
                          <span>Failed</span>
                        </span>
                      )}
                      {p.status === "created" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {invoice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300 font-mono text-[11px]">
                            {invoice.invoiceNumber}
                          </span>
                          <a
                            href={`/api/invoices/download?id=${invoice.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-zinc-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ) : p.status === "captured" ? (
                        <span className="text-[11px] text-zinc-500 italic">Generating...</span>
                      ) : (
                        <span className="text-[11px] text-zinc-600">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === "captured" && (
                          <Link
                            href={`/courses/${p.courseId}`}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors flex items-center gap-1"
                          >
                            <span>Learn</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}

                        {eligibleRefund && (
                          <button
                            onClick={() => setSelectedPaymentForRefund(p)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Request Modal */}
      {selectedPaymentForRefund && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Request Course Refund</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              You are requesting a refund for <strong className="text-white">{selectedPaymentForRefund.courseTitle}</strong> (Amount:{" "}
              {formatPrice(selectedPaymentForRefund.amountInPaise)}). Once processed, your enrollment access will be immediately revoked.
            </p>

            <form onSubmit={handleRequestRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Reason for Refund (Required):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Course content does not match expectations or purchased by mistake..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {refundErrorMsg && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {refundErrorMsg}
                </p>
              )}

              {refundSuccessMsg && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {refundSuccessMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={refundSubmitting}
                  onClick={() => setSelectedPaymentForRefund(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting || refundReason.trim().length < 3}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {refundSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
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
