import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Security Disclosure Policy | GenZNex EdTech India",
  description: "Responsible vulnerability disclosure guidelines, bug reporting procedures, and data security standards for GenZNex platform.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 w-full">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 mb-3">
            <GoogleIcon name="security" size={16} />
            <span>Zero-Trust Infrastructure Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Security &amp; Vulnerability Disclosure Policy
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Last Updated: October 2026 | Document Reference: GZN-POL-SEC-2026-V1
          </p>
          <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-800 dark:text-violet-300 text-xs leading-relaxed">
            <strong className="font-bold">Our Commitment:</strong> At GenZNex, the security and privacy of our students, trainers, and educational records are foundational. We welcome reports from independent security researchers and adhere to responsible disclosure principles.
          </div>
        </div>

        {/* Section 1: Security Architecture */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GoogleIcon name="shield" size={20} className="text-violet-600 dark:text-violet-400" />
            <span>1. Platform Security Principles</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            GenZNex is engineered with a defense-in-depth, zero-trust architecture designed to protect student credentials, payment sessions, and administrative actions:
          </p>
          <ul className="list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400 space-y-2 leading-relaxed">
            <li>
              <strong className="text-neutral-900 dark:text-white">Secrets &amp; API Key Management:</strong> Payment gateway keys (Razorpay) and signing secrets are managed strictly through Google Cloud Secret Manager (Firebase 2nd gen <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">defineSecret</code>) and never exposed to the frontend or bundled client-side.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white">Zero Client Pricing Trust:</strong> Course pricing and checkout orders are always computed and verified server-side inside secure Cloud Functions. Client requests cannot modify order amounts.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white">Role-Based Access Control (RBAC):</strong> Student, Trainer, and Admin roles are enforced cryptographically via Firebase Auth custom claims and Firestore Security Rules.
            </li>
            <li>
              <strong className="text-neutral-900 dark:text-white">Transport &amp; Storage Encryption:</strong> All traffic requires TLS 1.3 with Strict Transport Security (HSTS). Student records and certificate artifacts are encrypted at rest with AES-256.
            </li>
          </ul>
        </section>

        {/* Section 2: Vulnerability Disclosure Program */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GoogleIcon name="bug_report" size={20} className="text-amber-500" />
            <span>2. Responsible Disclosure &amp; Scope</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            If you identify a security issue or vulnerability in our platform, we invite you to report it responsibly. We ask that researchers allow us reasonable time to remediate before making any public disclosure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                In Scope
              </span>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
                <li>Authentication or session bypass vulnerabilities</li>
                <li>Privilege escalation between roles (Student / Trainer / Admin)</li>
                <li>Cross-Site Scripting (XSS) or Injection flaws</li>
                <li>Payment tampering or order spoofing vulnerabilities</li>
                <li>Firestore Security Rules bypass or unauthorized data access</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                Out of Scope
              </span>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
                <li>Denial of Service (DoS / DDoS) attacks</li>
                <li>Social engineering or phishing targeting staff or students</li>
                <li>Automated high-volume vulnerability scanners without manual POC</li>
                <li>Physical attacks against GenZNex premises</li>
                <li>Issues in third-party services outside GenZNex domain</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Safe Harbor */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GoogleIcon name="verified" size={20} className="text-emerald-500" />
            <span>3. Safe Harbor Commitment</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            GenZNex considers security research conducted under this policy to be authorized. We commit not to pursue legal action against researchers who:
          </p>
          <ul className="list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 leading-relaxed">
            <li>Make a good faith effort to avoid privacy violations and data destruction.</li>
            <li>Do not modify or exfiltrate another user&apos;s personal learning or payment data.</li>
            <li>Give us a minimum of 30 days to resolve the issue before publishing details.</li>
            <li>Do not violate applicable Indian cyber regulations (Information Technology Act, 2000).</li>
          </ul>
        </section>

        {/* Section 4: How to Report */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GoogleIcon name="mail" size={20} className="text-cyan-500" />
            <span>4. Reporting Procedure &amp; SLAs</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Please submit your vulnerability report with a clear proof-of-concept (POC) to our dedicated security response team:
          </p>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-neutral-500 block">Security Contact Email</span>
                <span className="text-base font-bold font-mono text-violet-600 dark:text-violet-400">
                  security@genznex.in
                </span>
              </div>
              <a
                href="mailto:security@genznex.in?subject=Security%20Vulnerability%20Report"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold self-start sm:self-auto"
              >
                <GoogleIcon name="send" size={14} />
                <span>Submit Report</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block">Acknowledgement SLA</span>
                <strong className="text-neutral-900 dark:text-white">Within 24 Hours</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Triage &amp; Severity Assessment</span>
                <strong className="text-neutral-900 dark:text-white">Within 72 Hours</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Remediation Updates</span>
                <strong className="text-neutral-900 dark:text-white">Weekly Progress Report</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Recognition */}
        <section className="space-y-3 pb-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <GoogleIcon name="workspace_premium" size={20} className="text-amber-500" />
            <span>5. Researcher Recognition</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Researchers who discover valid, previously unknown vulnerabilities that result in code fixes will be offered recognition in the GenZNex Security Hall of Fame and a digital certificate of appreciation.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
