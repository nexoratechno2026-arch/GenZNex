"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black text-black dark:text-white relative">
      <Card className="w-full max-w-md border-neutral-300 dark:border-neutral-800 shadow-lg">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mx-auto mb-3 group">
            <div className="w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
              <GoogleIcon name="bolt" size={20} filled />
            </div>
            <span className="font-bold text-xl tracking-tight text-black dark:text-white">GenZNex</span>
          </Link>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Join India&apos;s Next-Gen Tech Academy &amp; start learning today.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white text-xs flex items-center gap-2">
              <GoogleIcon name="error" size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <Input
              id="signup-name-input"
              label="Full Name"
              type="text"
              placeholder="Rahul Sharma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<GoogleIcon name="person" size={18} />}
              required
            />

            <Input
              id="signup-email-input"
              label="Email Address"
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<GoogleIcon name="mail" size={18} />}
              required
            />

            <Input
              id="signup-password-input"
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<GoogleIcon name="lock" size={18} />}
              required
            />

            <Input
              id="signup-confirm-password-input"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<GoogleIcon name="lock" size={18} />}
              required
            />

            <Button
              id="signup-submit-btn"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              rightIcon={<GoogleIcon name="arrow_forward" size={18} />}
              className="mt-2"
            >
              Create Account
            </Button>
          </form>

          {/* Social Sign Up Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-black px-2 text-neutral-500 font-bold">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              id="google-signup-btn"
              type="button"
              variant="secondary"
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
              variant="secondary"
              size="sm"
              leftIcon={<GoogleIcon name="phone" size={16} />}
              onClick={() => setPhoneModalOpen(true)}
              className="text-xs"
            >
              Phone OTP
            </Button>
          </div>

          <div className="pt-2 text-center text-xs text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              id="login-link"
              className="text-black dark:text-white font-bold underline underline-offset-2"
            >
              Sign in
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
