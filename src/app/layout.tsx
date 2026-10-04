import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d0d14",
};

export const metadata: Metadata = {
  title: "GenZNex | EdTech Platform for India - LMS, Training & Placements",
  description:
    "India's premier EdTech academy. Master Full-Stack AI, Cloud & DevOps with real craft. 1-click Razorpay checkout, Firebase 2nd Gen serverless architecture, and zero-trust security.",
  keywords: [
    "GenZNex",
    "EdTech India",
    "Full Stack AI",
    "DevOps Bootcamp",
    "Firebase Emulators",
    "Razorpay Payments",
    "LMS",
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
      className="h-full antialiased dark"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter + Manrope — core typography stack */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
        {/* Material Symbols for icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
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
