"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, User, Phone, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { PhoneOtpModal } from "@/components/auth/PhoneOtpModal";
import { useAuth } from "@/lib/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, role } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const navigateToRoleDashboard = (userRole: string) => {
    if (userRole === "admin") router.push("/admin");
    else if (userRole === "trainer") router.push("/trainer");
    else router.push("/student");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password, displayName);
      navigateToRoleDashboard(role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-600/15 blur-[120px] pointer-events-none -z-10" />

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
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Join India&apos;s next-gen tech community and unlock real-world bootcamps.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <Input
              id="signup-name-input"
              label="Full Name"
              type="text"
              placeholder="Aarav Sharma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              id="signup-email-input"
              label="Email Address"
              type="email"
              placeholder="aarav@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              id="signup-password-input"
              label="Password"
              type="password"
              placeholder="•••••••• (Min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              id="signup-confirm-password-input"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              required
            />

            <Button
              id="signup-submit-btn"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign Up Free
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12141e] px-2 text-gray-400 font-semibold">
                Or join with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              id="google-signup-btn"
              type="button"
              variant="outline"
              size="sm"
              loading={googleLoading}
              onClick={handleGoogleSignup}
              className="text-xs"
            >
              Google
            </Button>

            <Button
              id="phone-otp-signup-btn"
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
            Already have an account?{" "}
            <Link
              href="/login"
              id="login-link"
              className="text-purple-400 hover:text-purple-300 font-bold"
            >
              Sign In
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
