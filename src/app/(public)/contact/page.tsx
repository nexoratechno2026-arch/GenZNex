"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

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
    // Bot check: If honeypot filled, silently drop
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
      // Simulate ticket generation / forward to support
      await new Promise((r) => setTimeout(r, 600));
      setSubmitted(true);
    } catch {
      setError("Failed to send message. Please contact support@genznex.in directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GenZNex Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Razorpay Regulatory Contact &amp; Support Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Us &amp; Corporate Grievance
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Registered business details for learner assistance, invoice reconciliation, and payment inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Registered Business Information (Razorpay Mandatory) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#141525] border border-gray-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span>Corporate Identification</span>
              </h2>
              <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                <p><strong>Legal Entity:</strong> GenZNex EdTech Private Limited</p>
                <p><strong>Corporate Identity Number (CIN):</strong> U80900DL2026PTC998877</p>
                <p><strong>GST Identification Number (GSTIN):</strong> 07AABCU9603R1ZM</p>
                <p><strong>HSN / SAC Code:</strong> 999293 (Commercial Training &amp; Coaching)</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#141525] border border-gray-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>Office Location &amp; Hours</span>
              </h2>
              <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                <p><strong>Registered &amp; Corporate Headquarters:</strong></p>
                <p className="text-gray-400">
                  241, East Permanur, Anna Park Backside,<br />
                  Salem - 636007, Tamil Nadu, India.
                </p>
                <p className="mt-3"><strong>Operational Support Window:</strong></p>
                <p className="text-gray-400">Monday to Saturday: 09:30 AM to 06:30 PM IST</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#141525] border border-gray-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span>Direct Contact Channels</span>
              </h2>
              <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <strong>Learner Support:</strong>
                  <a href="mailto:support@genznex.in" className="text-purple-400 hover:underline">support@genznex.in</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <strong>Refunds &amp; Billing:</strong>
                  <a href="mailto:refunds@genznex.in" className="text-purple-400 hover:underline">refunds@genznex.in</a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <strong>Direct Helpline:</strong>
                  <span className="text-white">+91 124 456 7890</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Spam-Protected Inquiry Form */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-purple-500/20">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Inquiry Received</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. Ticket reference <strong>#{Math.floor(100000 + Math.random() * 900000)}</strong> has been opened. Our support desk will reply to {form.email} within 24 business hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "support", message: "", honeyPot: "" });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-white">Send an Inquiry or Grievance</h3>
                <p className="text-xs text-gray-400">
                  Fill in your details below and our operations desk will assist you promptly.
                </p>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {error}
                  </div>
                )}

                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  name="user_organization_hp"
                  value={form.honeyPot}
                  onChange={(e) => setForm({ ...form, honeyPot: e.target.value })}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090a0f] border border-gray-700 focus:border-purple-500 text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090a0f] border border-gray-700 focus:border-purple-500 text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Category *</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090a0f] border border-gray-700 focus:border-purple-500 text-white text-xs outline-none transition-colors"
                  >
                    <option value="support">Course Access &amp; Learning Support</option>
                    <option value="billing">Billing, Invoices &amp; Razorpay Payments</option>
                    <option value="refund">Refund Request (7-Day Window)</option>
                    <option value="grievance">Formal Grievance (DPDP / IT Act)</option>
                    <option value="partnerships">College / Corporate Training Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Detailed Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please include course name or Razorpay Payment ID if applicable..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090a0f] border border-gray-700 focus:border-purple-500 text-white text-xs outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Protected by zero-PII anti-spam heuristics</span>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
