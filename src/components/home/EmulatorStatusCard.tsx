import React from "react";
import { 
  Server, 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key, 
  Video, 
  Database,
  Terminal
} from "lucide-react";

export function EmulatorStatusCard() {
  const emulators = [
    { name: "Authentication", port: 9099, status: "Active", path: "http://127.0.0.1:9099" },
    { name: "Cloud Firestore", port: 8080, status: "Active", path: "http://127.0.0.1:8080" },
    { name: "Cloud Functions (2nd Gen)", port: 5001, status: "Active", path: "http://127.0.0.1:5001" },
    { name: "Cloud Storage", port: 9199, status: "Active", path: "http://127.0.0.1:9199" },
    { name: "Emulator UI Console", port: 4000, status: "Ready", path: "http://127.0.0.1:4000" },
  ];

  const rulesMatrix = [
    {
      rule: "Direct client writes to /payments",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Direct client writes to /enrollments",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Direct client writes to /certificates",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Server-Side Pricing Verification",
      enforcement: "Amount read from Firestore server-side",
      status: "Enforced",
      severity: "secure",
      handler: "createRazorpayOrder (Functions 2nd Gen)",
    },
    {
      rule: "Razorpay Secret Key Storage",
      enforcement: "Firebase Secret Manager (defineSecret)",
      status: "Protected",
      severity: "secure",
      handler: "Google Cloud Secret Manager / .env.local",
    },
    {
      rule: "Role-Based Access Control",
      enforcement: "request.auth.token.role in ['student', 'trainer', 'admin']",
      status: "Enforced",
      severity: "secure",
      handler: "Auth Custom Claims & Security Rules",
    },
    {
      rule: "Course Video Delivery",
      enforcement: "Signed URLs (Mux/Bunny/Vimeo), no raw storage exposure",
      status: "Enforced",
      severity: "secure",
      handler: "storage.rules boundary",
    },
  ];

  return (
    <section id="emulator-status" className="py-16 border-t border-gray-800/60 bg-[#07080d]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-3">
            <Server className="w-3.5 h-3.5" />
            <span>Firebase Emulator Suite &amp; Security Verification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Zero-Trust Architecture &amp; Local Emulators
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Never touching production during development. Every transaction, custom claim, and video stream is secured at the protocol level.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Emulator Services Status */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Configured Local Emulators</h3>
                </div>
                <a
                  href="http://127.0.0.1:4000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Open Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                {emulators.map((emu) => (
                  <div
                    key={emu.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0e101b] border border-gray-800/80 text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-200">{emu.name}</div>
                      <div className="text-gray-500 font-mono">Port {emu.port}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-indicator" />
                      <span className="font-semibold text-emerald-400">{emu.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-3 text-xs text-purple-200">
                <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Start suite with: <code className="text-cyan-300 font-mono">firebase emulators:start</code>
                </span>
              </div>
            </div>

            {/* Razorpay Secrets Status Card */}
            <div className="glass-card p-6 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Razorpay Secret Manager Isolation</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Secret keys are wrapped in <code className="text-purple-300">defineSecret(&quot;RAZORPAY_KEY_ID&quot;)</code> and injected directly into Cloud Functions runtime via Google Secret Manager. Frontend JavaScript and Firestore rules cannot read these credentials.
              </p>
            </div>
          </div>

          {/* Right Column: Security Rules Matrix */}
          <div className="lg:col-span-7">
            <div className="glass-card p-6 rounded-2xl border border-gray-800 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Project Rule Enforcement Matrix</h3>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                    Strict Mode
                  </span>
                </div>

                <div className="space-y-3">
                  {rulesMatrix.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0e101b] border border-gray-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-100 flex items-center gap-1.5">
                          {item.severity === "critical" ? (
                            <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : item.rule.includes("Video") ? (
                            <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{item.rule}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {item.enforcement}
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                            item.severity === "critical"
                              ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          }`}
                        >
                          {item.severity === "critical" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          <span>{item.status}</span>
                        </span>
                        <div className="text-[10px] text-gray-500 mt-1 font-mono">
                          {item.handler}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Rules Source: <code className="text-purple-300 font-mono">firestore.rules &amp; storage.rules</code></span>
                <span className="text-emerald-400 font-semibold">100% Compliant</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
