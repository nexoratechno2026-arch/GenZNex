"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { InvoiceDoc } from "@/types/schema";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const courseId = searchParams.get("courseId");
  const courseSlug = searchParams.get("slug");

  const [invoice, setInvoice] = useState<InvoiceDoc | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      if (!orderId) return;
      try {
        setLoadingInvoice(true);
        const db = getFirebaseFirestore();
        const invoiceRef = doc(db, "invoices", `inv_${orderId}`);
        const snap = await getDoc(invoiceRef);
        if (snap.exists()) {
          setInvoice(snap.data() as InvoiceDoc);
        }
      } catch (err) {
        console.error("Failed to load invoice:", err);
      } finally {
        setLoadingInvoice(false);
      }
    }
    fetchInvoice();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 py-16">
        <div className="max-w-xl w-full p-8 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center relative overflow-hidden">
          {/* Glow accent */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Payment &amp; Enrollment Verified</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
            Welcome to the Bootcamp! 🚀
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
            Your payment was processed securely and your lifetime curriculum access is now fully unlocked.
          </p>

          {/* Transaction Summary Card */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-left text-xs space-y-2 mb-8">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Order Reference:</span>
              <code className="text-neutral-900 dark:text-neutral-200 font-mono text-[11px]">{orderId || "N/A"}</code>
            </div>
            {paymentId && (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Payment ID:</span>
                <code className="text-neutral-900 dark:text-neutral-200 font-mono text-[11px]">{paymentId}</code>
              </div>
            )}
            {invoice && (
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Tax Invoice Number:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{invoice.invoiceNumber}</strong>
              </div>
            )}
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span>Access Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Active &amp; Lifetime
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href={courseSlug ? `/courses/${courseSlug}` : courseId ? `/courses` : "/courses"}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-violet-600/30 transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Go to Course Curriculum</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {invoice ? (
              <a
                href={`/api/invoices/download?id=${invoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-sm transition-all border border-neutral-300 dark:border-neutral-700"
              >
                <Download className="h-4 w-4 text-emerald-500" />
                <span>Download Tax Invoice (PDF)</span>
              </a>
            ) : loadingInvoice ? (
              <div className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Invoice PDF...</span>
              </div>
            ) : (
              <Link
                href="/student/payments"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-300 font-semibold text-sm transition-all border border-neutral-300 dark:border-neutral-700"
              >
                <FileText className="h-4 w-4" />
                <span>View in Payments</span>
              </Link>
            )}
          </div>

          <p className="text-[11px] text-neutral-500">
            A copy of your GST tax invoice receipt has also been dispatched to your registered email address.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
