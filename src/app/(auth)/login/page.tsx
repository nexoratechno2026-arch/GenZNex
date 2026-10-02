"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Phone, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { PhoneOtpModal } from "@/components/auth/PhoneOtpModal";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, role } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const navigateToRoleDashboard = (userRole: string) => {
    if (userRole === "admin") router.push("/admin");
    else if (userRole === "trainer") router.push("/trainer");
    else router.push("/student");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      navigateToRoleDashboard(role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      navigateToRoleDashboard(role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/15 blur-[120px] pointer-events-none -z-10" />

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
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your bootcamps, courses, and placements.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <Input
              id="login-email-input"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-semibold text-gray-300 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12141e] px-2 text-gray-400 font-semibold">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              id="google-login-btn"
              type="button"
              variant="outline"
              size="sm"
              loading={googleLoading}
              onClick={handleGoogleLogin}
              className="text-xs"
            >
              Google
            </Button>

            <Button
              id="phone-otp-login-btn"
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Phone className="w-3.5 h-3.5 text-cyan-400" />}
              onClick={() => setPhoneModalOpen(true)}
              className="text-xs"
            >
              Phone OTP
            </Button>
          </div>

          <div className="pt-2 text-center text-xs text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              id="signup-link"
              className="text-purple-400 hover:text-purple-300 font-bold"
            >
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>

      <PhoneOtpModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onSuccess={() => navigateToRoleDashboard(role)}
      />
    </div>
  );
}
