import { defineSecret } from "firebase-functions/params";

/**
 * Secret definitions for Razorpay.
 * In production, managed securely via Google Cloud Secret Manager.
 * In local emulator, injected via .env.local or functions emulator config.
 */
export const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
export const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
export const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");
