"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { PhoneOtpModal } from "@/components/auth/PhoneOtpModal";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black text-black dark:text-white relative">
      <Card className="w-full max-w-md border-neutral-300 dark:border-neutral-800 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" href="/" />
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your bootcamps, courses, and certificates.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white text-xs flex items-center gap-2">
              <GoogleIcon name="error" size={16} className="shrink-0" />
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
              leftIcon={<GoogleIcon name="mail" size={18} />}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
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
                leftIcon={<GoogleIcon name="lock" size={18} />}
                required
              />
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              rightIcon={<GoogleIcon name="arrow_forward" size={18} />}
            >
              Sign In
            </Button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-black px-2 text-neutral-500 font-bold">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              id="google-login-btn"
              type="button"
              variant="secondary"
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
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              id="signup-link"
              className="text-black dark:text-white font-bold underline underline-offset-2"
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
