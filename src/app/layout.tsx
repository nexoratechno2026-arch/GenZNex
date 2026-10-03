import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090a0f",
};

export const metadata: Metadata = {
  title: "GenZNex | Gen Z EdTech Platform for India - LMS, Training & Placements",
  description:
    "India's next-gen EdTech academy. Master Full-Stack AI, Cloud & DevOps with real craft. 1-click Razorpay checkout, Firebase 2nd Gen serverless architecture, and zero-trust security.",
  keywords: [
    "GenZNex",
    "EdTech India",
    "Full Stack AI",
    "DevOps Bootcamp",
    "Firebase Emulators",
    "Razorpay Payments",
    "Gen Z LMS",
  ],
  authors: [{ name: "GenZNex Platform" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#090a0f] text-gray-100 selection:bg-purple-500/30 selection:text-purple-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <CookieConsentBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
