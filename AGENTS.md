# GenZNex Project Rules & Guidelines

## Product Overview
- **Product**: GenZNex, a Gen Z EdTech platform for India (LMS + student training + Razorpay payments).
- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS, Firebase (Auth, Firestore, Cloud Functions 2nd gen, Storage, Hosting/App Hosting), Razorpay.

## Core Rules & Architecture Principles
1. **Emulators First**: Always use the Firebase Emulator Suite for local dev and testing. Never touch production.
2. **Secrets & Keys**: Razorpay keys strictly via Firebase Secret Manager (`defineSecret`). Never in frontend code, Firestore, or committed files. Use `.env.local` for local dev and ensure it is in `.gitignore`.
3. **Data Integrity & Security**: Clients must **never** write directly to `payments`, `enrollments`, or `certificates`. Only Cloud Functions may write them.
4. **Server-Side Pricing**: Payment amounts are always read directly from Firestore on the server (Cloud Functions) and never trusted from the client.
5. **Role-Based Access Control**: Roles (`student`, `trainer`, `admin`) managed via Firebase Auth custom claims and strictly enforced in Firestore & Storage Security Rules.
6. **Video Delivery**: Course videos are served via a video provider (Mux/Bunny/Vimeo) with signed URLs, never direct raw Storage bucket links.
7. **Code Quality**: Strict TypeScript, small modular reusable components, Zod validation for inputs/schemas, zero unused dependencies.
8. **Design & UX**: Mobile-first, dark/light mode support, vibrant & bold Gen Z aesthetic, WCAG AA accessibility compliance.

## Workflow Protocol
- **Before each phase**: Produce an Implementation Plan artifact and wait for user approval before making changes.
- **After each phase**: Run dev servers/emulators, test in the browser, and provide a Walkthrough with screenshots/recordings.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
