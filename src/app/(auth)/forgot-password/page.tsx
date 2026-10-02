"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { sendPasswordReset } from "@/lib/firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern relative">
      <Card className="w-full max-w-md border-gray-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mx-auto mb-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1.5px]">
              <div className="w-full h-full bg-[#0d0e17] rounded-[9px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">GenZNex</span>
          </Link>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your registered email address and we&apos;ll send you a password reset link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-sm text-white">Check Your Inbox</p>
              <p className="text-gray-300 leading-relaxed">
                We have sent instructions to <strong>{email}</strong>. Follow the link in the email to reset your password.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 underline"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="reset-email-input"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                id="reset-submit-btn"
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-gray-400">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
