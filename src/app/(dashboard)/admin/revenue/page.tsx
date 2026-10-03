"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  RotateCcw,
  Tag,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { PaymentDoc, PaymentConfigDoc } from "@/types/schema";

export default function AdminRevenuePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [config, setConfig] = useState<PaymentConfigDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const db = getFirebaseFirestore();

        // 1. Fetch payments
        const snap = await getDocs(collection(db, "payments"));
        const list: PaymentDoc[] = [];
        snap.forEach((d) => list.push(d.data() as PaymentDoc));
        setPayments(list);

        // 2. Fetch config
        const configSnap = await getDoc(doc(db, "config", "payments"));
        if (configSnap.exists()) {
          setConfig(configSnap.data() as PaymentConfigDoc);
        }
      } catch (err) {
        console.error("Error loading revenue data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  // Calculations
  const capturedPayments = payments.filter((p) => p.status === "captured");
  const refundedPayments = payments.filter((p) => p.status === "refunded");

  const grossVolumePaise = capturedPayments.reduce((acc, p) => acc + (p.amountInPaise || 0), 0);
  const refundedVolumePaise = refundedPayments.reduce((acc, p) => acc + (p.amountInPaise || 0), 0);
  const netRevenuePaise = Math.max(0, grossVolumePaise - refundedVolumePaise);

  const totalGstCollectedPaise = capturedPayments.reduce(
    (acc, p) => acc + (p.amountBreakdown?.gstInPaise || 0),
    0
  );

  const totalCouponSavingsPaise = payments.reduce(
    (acc, p) => acc + (p.amountBreakdown?.discountInPaise || 0),
    0
  );

  const aovPaise = capturedPayments.length > 0 ? Math.round(grossVolumePaise / capturedPayments.length) : 0;

  // Group by course
  const courseMetrics: Record<
    string,
    { title: string; count: number; grossPaise: number; refundCount: number }
  > = {};

  for (const p of payments) {
    const courseId = p.courseId || "unknown";
    if (!courseMetrics[courseId]) {
      courseMetrics[courseId] = {
        title: p.courseTitle || "Course",
        count: 0,
        grossPaise: 0,
        refundCount: 0,
      };
    }
    if (p.status === "captured") {
      courseMetrics[courseId].count += 1;
      courseMetrics[courseId].grossPaise += p.amountInPaise || 0;
    } else if (p.status === "refunded") {
      courseMetrics[courseId].refundCount += 1;
    }
  }

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
        <p className="text-sm">Calculating financial metrics & GST accounting...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            <span>Revenue & Tax Compliance</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time monetization analytics, GST tax liability, student coupon savings, and course profitability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>View All Payments</span>
          </Link>
          <Link
            href="/admin/coupons"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Coupons</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Net Realized Revenue</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(netRevenuePaise)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Gross sales minus refunded fees</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Gross Volume</span>
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(grossVolumePaise)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">{capturedPayments.length} paid enrollments</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">GST Collected (18%)</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(totalGstCollectedPaise)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">SAC 999293 output tax liability</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Coupon Savings Impact</span>
            <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <Tag className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(totalCouponSavingsPaise)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Total discounts given to learners</p>
        </div>
      </div>

      {/* Course-wise Breakdown Table */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Course Earnings Breakdown</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3">Paid Enrollments</th>
                <th className="py-2.5 px-3">Refunds</th>
                <th className="py-2.5 px-3 text-right">Gross Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {Object.entries(courseMetrics).map(([courseId, m]) => (
                <tr key={courseId} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-3 font-semibold text-white">{m.title}</td>
                  <td className="py-3 px-3">{m.count} students</td>
                  <td className="py-3 px-3">
                    {m.refundCount > 0 ? (
                      <span className="text-rose-400 font-semibold">{m.refundCount} refunds</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {formatPrice(m.grossPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax & Platform Compliance Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-3 text-xs text-zinc-300">
        <div className="flex items-center gap-2 text-violet-400 font-bold">
          <ShieldCheck className="h-4 w-4" />
          <span>Statutory Business & GST Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px]">BUSINESS NAME</span>
            <p className="font-semibold text-white">{config?.businessName || "GenZNex EdTech Private Limited"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px]">GSTIN</span>
            <p className="font-semibold text-white font-mono">{config?.gstin || "27AABCU9603R1ZM"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px]">REGISTERED ADDRESS</span>
            <p className="text-zinc-400">{config?.businessAddress || "241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 text-[11px]">TAX CLASSIFICATION & INVOICING</span>
            <p className="text-zinc-400">
              SAC Code: <strong className="text-white">{config?.hsnSacCode || "999293"}</strong> | Prefix:{" "}
              <strong className="text-white">{config?.invoicePrefix || "GZN-INV-2026-"}</strong>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed mt-3">
          <strong>Important CA Compliance Disclaimer:</strong>{" "}
          {config?.caDisclaimer ||
            "Please consult a certified Chartered Accountant to verify GST treatment, state-wise reverse charge, and B2B/B2C tax compliance under Indian GST laws."}
        </div>
      </div>
    </div>
  );
}
