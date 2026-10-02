"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Phone, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { setupRecaptcha, sendPhoneOtp, confirmPhoneOtp } from "@/lib/firebase/auth";
import type { ConfirmationResult } from "firebase/auth";

interface PhoneOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PhoneOtpModal({ isOpen, onClose, onSuccess }: PhoneOtpModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const verifier = setupRecaptcha("recaptcha-container");
      const result = await sendPhoneOtp(phoneNumber, verifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);

    try {
      await confirmPhoneOtp(confirmationResult, otpCode);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPhoneNumber("");
    setOtpCode("");
    setStep("phone");
    setConfirmationResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetState}
      title={step === "phone" ? "Sign In with Phone OTP" : "Enter Verification Code"}
      description={
        step === "phone"
          ? "Enter your 10-digit Indian mobile number (+91) to receive a secure SMS OTP."
          : `We sent a 6-digit OTP code to ${phoneNumber}.`
      }
    >
      <div id="recaptcha-container" />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="9876543210"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Enter 10-digit Indian phone number"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            id="send-otp-btn"
          >
            Send OTP SMS
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label="6-Digit OTP"
            type="text"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            maxLength={6}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            id="verify-otp-btn"
          >
            Verify &amp; Sign In
          </Button>

          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-center text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Change Phone Number
          </button>
        </form>
      )}
    </Modal>
  );
}
