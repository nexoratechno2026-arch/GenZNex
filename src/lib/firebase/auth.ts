import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  ConfirmationResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";
import type { UserDoc, UserRole } from "@/types/schema";

const googleProvider = new GoogleAuthProvider();

/**
 * Synchronize user profile in Firestore
 */
export async function syncUserProfile(
  user: User,
  additionalData: Partial<UserDoc> = {}
): Promise<UserDoc> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const existing = snapshot.data() as UserDoc;
    return existing;
  }

  // New user defaults to 'student' role
  const newProfile: Record<string, unknown> = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || additionalData.displayName || "Gen Z Scholar",
    role: "student" as UserRole,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (user.phoneNumber) {
    newProfile.phoneNumber = user.phoneNumber;
  }
  if (user.photoURL) {
    newProfile.photoURL = user.photoURL;
  }
  Object.entries(additionalData).forEach(([k, v]) => {
    if (v !== undefined) {
      newProfile[k] = v;
    }
  });

  await setDoc(userRef, newProfile);
  return newProfile as unknown as UserDoc;
}

/**
 * 1. Sign up with Email and Password
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  if (displayName) {
    await updateProfile(user, { displayName });
  }

  await syncUserProfile(user, { displayName });
  return user;
}

/**
 * 2. Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(userCredential.user);
  return userCredential.user;
}

/**
 * 3. Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * 4. Setup Invisible reCAPTCHA for Phone OTP
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear any existing recaptcha verifier
  const existing = (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
  if (existing) {
    existing.clear();
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });

  (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = verifier;
  return verifier;
}

/**
 * 5. Send Phone OTP (India +91 format)
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // Format Indian phone number if entered as 10 digits
  let formattedNumber = phoneNumber.trim();
  if (!formattedNumber.startsWith("+")) {
    if (formattedNumber.length === 10) {
      formattedNumber = `+91${formattedNumber}`;
    } else {
      formattedNumber = `+${formattedNumber}`;
    }
  }

  return await signInWithPhoneNumber(auth, formattedNumber, verifier);
}

/**
 * 6. Confirm Phone OTP
 */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string,
  displayName?: string
): Promise<User> {
  const result = await confirmationResult.confirm(otpCode);
  await syncUserProfile(result.user, { displayName });
  return result.user;
}

/**
 * 7. Send Password Reset
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * 8. Log out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
