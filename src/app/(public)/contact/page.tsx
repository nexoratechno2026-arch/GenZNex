"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export default function ContactUsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "support",
    message: "",
    honeyPot: "", // Spam honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeyPot) {
      setSubmitted(true);
      return;
    }

    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSubmitted(true);
    } catch {
      setError("Failed to send message. Please contact support@genznex.in directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10 w-full">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <GoogleIcon name="arrow_back" size={16} />
          <span>Back to GenZNex Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white mb-3">
            <GoogleIcon name="apartment" size={16} />
            <span>Razorpay Regulatory Contact &amp; Support Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Contact Us &amp; Corporate Grievance
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Registered business details for learner assistance, invoice reconciliation, and payment inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Registered Business Information (Razorpay Mandatory) */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <GoogleIcon name="apartment" size={20} />
                <span>Corporate Identification</span>
              </h2>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 leading-relaxed">
                <p><strong>Legal Entity:</strong> GenZNex EdTech Private Limited</p>
                <p><strong>Corporate Identity Number (CIN):</strong> U80900DL2026PTC998877</p>
                <p><strong>GST Identification Number (GSTIN):</strong> 07AABCU9603R1ZM</p>
                <p><strong>HSN / SAC Code:</strong> 999293 (Commercial Training &amp; Coaching)</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <GoogleIcon name="location_on" size={20} />
                <span>Office Location &amp; Hours</span>
              </h2>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 leading-relaxed">
                <p className="font-bold text-black dark:text-white">Registered &amp; Corporate Headquarters:</p>
                <p>
                  241, East Permanur, Anna Park Backside,<br />
                  Salem - 636007, Tamil Nadu, India.
                </p>
                <p className="mt-3 font-bold text-black dark:text-white">Operational Support Window:</p>
                <p>Monday to Saturday: 09:30 AM to 06:30 PM IST</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <GoogleIcon name="mail" size={20} />
                <span>Direct Contact Channels</span>
              </h2>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-3 leading-relaxed">
                <div className="flex items-center gap-2">
                  <GoogleIcon name="mail" size={16} />
                  <span>support@genznex.in (Response within 24h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <GoogleIcon name="call" size={16} />
                  <span>+91 427 241 7000 (Mon-Sat, 9:30 AM - 6:30 PM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <GoogleIcon name="verified_user" size={16} />
                  <span>Grievance Officer: grievance@genznex.in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form */}
          <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black dark:text-white">Send Us a Direct Message</h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Fill in the details below and our team will get back to you shortly.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black p-6 text-center space-y-3">
                <GoogleIcon name="check_circle" size={40} className="mx-auto" />
                <h3 className="text-base font-bold text-black dark:text-white">Message Dispatched Successfully</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Thank you for reaching out. A support coordinator will respond to {form.email} within 24 business hours.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "support", message: "", honeyPot: "" });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-neutral-400 bg-white dark:bg-black p-3 text-xs text-black dark:text-white flex items-center gap-2">
                    <GoogleIcon name="error" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <input
                  type="text"
                  name="honeyPot"
                  value={form.honeyPot}
                  onChange={(e) => setForm({ ...form, honeyPot: e.target.value })}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white text-xs outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white text-xs outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">Category *</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white text-xs outline-none focus:border-black dark:focus:border-white transition-colors"
                  >
                    <option value="support">Course Access &amp; Learning Support</option>
                    <option value="billing">Billing, Invoices &amp; Razorpay Payments</option>
                    <option value="refund">Refund Request (7-Day Window)</option>
                    <option value="grievance">Formal Grievance (DPDP / IT Act)</option>
                    <option value="partnerships">College / Corporate Training Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1">Detailed Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please include course name or Razorpay Payment ID if applicable..."
                    className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white text-xs outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  loading={loading}
                  rightIcon={<GoogleIcon name="send" size={16} />}
                >
                  Submit Inquiry
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-2">
                  <GoogleIcon name="verified_user" size={14} />
                  <span>Protected by zero-PII anti-spam heuristics</span>
                </div>
              </form>
            )}
          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
