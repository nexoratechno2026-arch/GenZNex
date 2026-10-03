import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { CourseDoc, CategoryDoc, CourseStatus, CourseLevel, CourseLanguage, LessonType } from "../src/types/schema";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

const CATEGORIES: CategoryDoc[] = [
  {
    id: "web-development",
    name: "Web Development",
    slug: "web-development",
    description: "Master modern full-stack web development with Next.js, React, Node.js, and cloud native architectures.",
    icon: "Code2",
    courseCount: 3,
    order: 1,
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    slug: "ai-ml",
    description: "Learn Deep Learning, Generative AI, LLM Fine-tuning, PyTorch, and Autonomous AI Agent frameworks.",
    icon: "Bot",
    courseCount: 2,
    order: 2,
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    slug: "data-analytics",
    description: "Transform big data into actionable business intelligence with SQL, Pandas, Tableau, and Power BI.",
    icon: "BarChart3",
    courseCount: 2,
    order: 3,
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    slug: "digital-marketing",
    description: "Hyper-growth marketing, viral organic loops, performance ads, SEO, and retention engines for Gen Z.",
    icon: "TrendingUp",
    courseCount: 1,
    order: 4,
  },
  {
    id: "communication-skills",
    name: "Communication Skills",
    slug: "communication-skills",
    description: "Executive presentation, workplace negotiation, corporate fluency, and storytelling for engineers.",
    icon: "Sparkles",
    courseCount: 1,
    order: 5,
  },
  {
    id: "placement-prep",
    name: "Placement Prep",
    slug: "placement-prep",
    description: "Crack Tier-1 and FAANG tech interviews: DSA in Java/C++, System Design, resume reviews, and mock rounds.",
    icon: "Briefcase",
    courseCount: 3,
    order: 6,
  },
];

interface SeedUser {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "trainer" | "student";
  headline?: string;
  bio?: string;
  photoURL?: string;
}

const SEED_USERS: SeedUser[] = [
  {
    uid: "admin_super_01",
    email: "admin@genznex.in",
    displayName: "GenZNex Super Admin",
    role: "admin",
    headline: "Platform Administrator",
    bio: "Chief Operations & Curriculum Director at GenZNex EdTech India.",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  },
  {
    uid: "trainer_vikram_01",
    email: "vikram@genznex.in",
    displayName: "Vikram Malhotra",
    role: "trainer",
    headline: "Principal Architect & Ex-Google Senior Tech Lead",
    bio: "12+ years building web-scale cloud systems. Mentored 15,000+ Indian engineering students into high-paying global tech roles.",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    uid: "trainer_ananya_02",
    email: "ananya@genznex.in",
    displayName: "Ananya Iyer",
    role: "trainer",
    headline: "AI Research Scientist & Deep Learning Specialist",
    bio: "PhD in Deep Learning from IISc Bangalore. Former Meta AI researcher specializing in transformers, agentic reasoning, and scalable NLP.",
    photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
  },
  {
    uid: "trainer_rohit_03",
    email: "rohit@genznex.in",
    displayName: "Rohit Mehta",
    role: "trainer",
    headline: "VP Product Growth & Executive Career Coach",
    bio: "Helped 400+ students secure 18+ LPA campus placements across Bangalore, Hyderabad, Pune, and Gurgaon.",
    photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    uid: "student_rahul_01",
    email: "student@genznex.in",
    displayName: "Rahul Sharma",
    role: "student",
    headline: "Aspiring AI Full Stack Engineer",
    bio: "Final year B.Tech CS undergrad at Delhi Technological University. Building modern SaaS and learning AI.",
    photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop",
  },
];

interface CourseSeedDef {
  id: string;
  data: Omit<CourseDoc, "id" | "createdAt" | "updatedAt">;
  modules: Array<{
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      title: string;
      order: number;
      type: LessonType;
      durationMinutes: number;
      isPreview: boolean;
      videoMetadata?: {
        provider: "mux" | "bunny" | "vimeo" | "youtube";
        videoId: string;
        durationSeconds?: number;
      };
      pdfUrl?: string;
      textContent?: string;
      externalLink?: string;
    }>;
  }>;
}

const COURSES: CourseSeedDef[] = [
  {
    id: "course_nextjs_fullstack",
    data: {
      title: "Full Stack Next.js 15 & AI Apps Mastery",
      slug: "nextjs-fullstack-ai-mastery",
      subtitle: "Build enterprise Next.js App Router applications with Server Actions, Tailwind CSS, TypeScript, and OpenAI / Claude SDK integration.",
      description: "Step into the bleeding-edge world of Next.js 15. In this hands-on, production-grade course, you will build full-stack web applications from scratch using Server Components, Streaming SSR, Optimistic UI, and generative AI APIs. Designed specifically for Indian software engineers aiming for top product companies.",
      category: "web-development",
      categoryName: "Web Development",
      tags: ["Next.js", "React", "TypeScript", "Tailwind CSS", "AI"],
      level: "intermediate" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 349900,
      discountPriceInPaise: 199900,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Architect clean, scalable Next.js 15 applications using App Router & Server Actions",
        "Build type-safe CRUD APIs with Zod, Drizzle ORM, and Supabase / Firebase",
        "Stream LLM completions with Vercel AI SDK and Tailwind UI components",
        "Deploy to high-concurrency production environments with zero downtime",
      ],
      requirements: [
        "Working knowledge of modern JavaScript (ES6+) and basic React concepts",
        "Familiarity with HTML/CSS and basic terminal commands",
      ],
      instructor: {
        uid: "trainer_vikram_01",
        name: "Vikram Malhotra",
        headline: "Principal Architect & Ex-Google Senior Tech Lead",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_vikram_01",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.9,
      ratingCount: 428,
      enrollmentCount: 1420,
      lessonCount: 6,
      totalDurationMinutes: 285,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Next.js 15 Foundations & Modern Architecture",
        description: "Understand Server vs Client Components, nested layouts, and server actions.",
        order: 1,
        lessons: [
          {
            title: "Course Overview & Architecture Blueprint",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "nextjs_intro_01", durationSeconds: 1500 },
            durationMinutes: 25,
            isPreview: true,
          },
          {
            title: "Deep Dive: React Server Components & Streaming SSR",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "nextjs_rsc_02", durationSeconds: 2700 },
            durationMinutes: 45,
            isPreview: true,
          },
          {
            title: "Official Architecture Cheatsheet & Code Standards",
            order: 3,
            type: "pdf",
            pdfUrl: "https://example.com/assets/nextjs15-cheatsheet.pdf",
            durationMinutes: 15,
            isPreview: false,
          },
        ],
      },
      {
        title: "Module 2: Building AI-Augmented Full-Stack Applications",
        description: "Integrate generative AI APIs, streaming UI, and modern caching.",
        order: 2,
        lessons: [
          {
            title: "Streaming LLM Responses with Vercel AI SDK",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "nextjs_ai_03", durationSeconds: 3300 },
            durationMinutes: 55,
            isPreview: false,
          },
          {
            title: "Optimistic Updates & Server Action Mutexes",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "nextjs_actions_04", durationSeconds: 3900 },
            durationMinutes: 65,
            isPreview: false,
          },
          {
            title: "Full GitHub Repo & Starter Templates",
            order: 3,
            type: "link",
            externalLink: "https://github.com/genznex/nextjs-ai-starter",
            durationMinutes: 80,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_zero_to_hero_frontend",
    data: {
      title: "Zero to Hero: Modern React & Tailwind CSS",
      slug: "zero-to-hero-react-tailwind",
      subtitle: "Beginner-friendly, 100% free bootstrapper to kickstart your frontend journey with hands-on projects.",
      description: "Start coding beautiful, modern user interfaces today with React 19 and Tailwind CSS v4. No prior web development experience required. Learn by doing 4 real-world projects including an interactive portfolio, a live crypto dashboard, and an e-commerce storefront.",
      category: "web-development",
      categoryName: "Web Development",
      tags: ["React", "Tailwind CSS", "JavaScript", "Beginner", "Free"],
      level: "beginner" as CourseLevel,
      language: "Tamil" as CourseLanguage,
      priceInPaise: 0,
      discountPriceInPaise: 0,
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Master React fundamentals: components, props, hooks (useState, useEffect, useMemo)",
        "Build pixel-perfect responsive layouts with Tailwind CSS utility classes",
        "Consume REST APIs with error handling and shimmer loading states",
        "Deploy your live projects for free on Vercel and Netlify",
      ],
      requirements: [
        "A computer with any browser and VS Code installed",
        "Zero coding experience required; we start from absolute scratch",
      ],
      instructor: {
        uid: "trainer_vikram_01",
        name: "Vikram Malhotra",
        headline: "Principal Architect & Ex-Google Senior Tech Lead",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_vikram_01",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.8,
      ratingCount: 890,
      enrollmentCount: 3840,
      lessonCount: 4,
      totalDurationMinutes: 180,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: React 19 Essentials",
        description: "Components, JSX, state, and props made ridiculously simple.",
        order: 1,
        lessons: [
          {
            title: "Welcome & Setting up your Modern Dev Environment",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "react_intro_01", durationSeconds: 1200 },
            durationMinutes: 20,
            isPreview: true,
          },
          {
            title: "Building your First Interactive React Component",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "react_comp_02", durationSeconds: 2400 },
            durationMinutes: 40,
            isPreview: true,
          },
        ],
      },
      {
        title: "Module 2: Tailwind CSS v4 & Capstone Project",
        description: "Styling like a pro with Tailwind utility classes and animations.",
        order: 2,
        lessons: [
          {
            title: "Tailwind CSS v4 Complete Crash Course",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "tailwind_01", durationSeconds: 3000 },
            durationMinutes: 50,
            isPreview: true,
          },
          {
            title: "Building a Live Portfolio with Dark Mode",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "portfolio_01", durationSeconds: 4200 },
            durationMinutes: 70,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_deep_learning_agents",
    data: {
      title: "Generative AI & Autonomous Agent Architectures",
      slug: "genai-autonomous-agents",
      subtitle: "Build multi-agent swarms, RAG pipelines, and tool-calling AI systems with LangChain, LlamaIndex, and OpenAI.",
      description: "Dive deep into modern GenAI engineering. Go beyond simple prompt engineering to build autonomous reasoning agents, production RAG pipelines with vector databases, and multi-agent coordination frameworks.",
      category: "ai-ml",
      categoryName: "AI & Machine Learning",
      tags: ["AI", "GenAI", "LangChain", "Python", "RAG", "LLM"],
      level: "advanced" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 699900,
      discountPriceInPaise: 449900,
      thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Design production multi-agent architectures using LangGraph and AutoGen",
        "Implement hybrid search RAG with Pinecone, Qdrant, and BM25 rerankers",
        "Fine-tune open-weights models (Llama 3, Mistral) using LoRA / QLoRA",
        "Evaluate AI systems with hallucination metrics and automated guardrails",
      ],
      requirements: [
        "Proficiency in Python programming and basic machine learning concepts",
        "Understanding of API keys, HTTP requests, and basic vector arithmetic",
      ],
      instructor: {
        uid: "trainer_ananya_02",
        name: "Ananya Iyer",
        headline: "AI Research Scientist & Deep Learning Specialist",
        photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_ananya_02",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.95,
      ratingCount: 310,
      enrollmentCount: 850,
      lessonCount: 4,
      totalDurationMinutes: 240,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Agentic Reasoning & Tool Calling",
        description: "ReAct patterns, planning, and memory in LLM applications.",
        order: 1,
        lessons: [
          {
            title: "The Agentic Paradigm: Beyond Simple Prompting",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "agent_intro_01", durationSeconds: 2700 },
            durationMinutes: 45,
            isPreview: true,
          },
          {
            title: "Implementing Structured Outputs & Function Calling",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "agent_tools_02", durationSeconds: 3900 },
            durationMinutes: 65,
            isPreview: false,
          },
        ],
      },
      {
        title: "Module 2: Production Multi-Agent Swarms",
        description: "Orchestrate specialized agents collaborating on complex workflows.",
        order: 2,
        lessons: [
          {
            title: "LangGraph State Machines & Cyclic Agent Loops",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "langgraph_03", durationSeconds: 4200 },
            durationMinutes: 70,
            isPreview: false,
          },
          {
            title: "Agent Architecture Whitepaper & Industry Benchmarks",
            order: 2,
            type: "pdf",
            pdfUrl: "https://example.com/assets/agent-whitepaper.pdf",
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_python_data_science",
    data: {
      title: "Python for Data Science, Pandas & SQL Bootcamp",
      slug: "python-data-science-bootcamp",
      subtitle: "The practical data analytics bootcamp: manipulate millions of rows, query relational databases, and build visual dashboards.",
      description: "Become job-ready in Data Analytics. Learn how to clean messy real-world datasets, perform exploratory data analysis (EDA), execute complex SQL joins and window functions, and communicate insights with Seaborn and Plotly.",
      category: "data-analytics",
      categoryName: "Data Analytics",
      tags: ["Data Science", "Python", "SQL", "Pandas", "Analytics"],
      level: "beginner" as CourseLevel,
      language: "Tamil" as CourseLanguage,
      priceInPaise: 249900,
      discountPriceInPaise: 129900,
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Master data manipulation with NumPy and Pandas DataFrames",
        "Write advanced SQL queries with CTEs, window functions, and indexing",
        "Clean, reshape, and impute real-world missing data",
        "Deliver professional data reports and executive summaries",
      ],
      requirements: [
        "No prior programming experience required",
        "Basic high-school arithmetic and logical thinking",
      ],
      instructor: {
        uid: "trainer_ananya_02",
        name: "Ananya Iyer",
        headline: "AI Research Scientist & Deep Learning Specialist",
        photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_ananya_02",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.75,
      ratingCount: 540,
      enrollmentCount: 2100,
      lessonCount: 4,
      totalDurationMinutes: 210,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Python Data Science Stack",
        description: "Python syntax, NumPy arrays, and Pandas DataFrames.",
        order: 1,
        lessons: [
          {
            title: "Data Science Workflow & Jupyter Setup",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "python_intro_01", durationSeconds: 1800 },
            durationMinutes: 30,
            isPreview: true,
          },
          {
            title: "Pandas Data Cleaning & Transformation Magic",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "pandas_clean_02", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
      {
        title: "Module 2: Advanced SQL for Analytics",
        description: "PostgreSQL, window functions, and analytics case studies.",
        order: 2,
        lessons: [
          {
            title: "Mastering Window Functions & CTEs",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "sql_window_01", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: false,
          },
          {
            title: "Real Indian E-Commerce Dataset Case Study",
            order: 2,
            type: "text",
            textContent: "Comprehensive walkthrough analyzing 500,000 orders from Indian D2C brands, identifying customer churn patterns and lifetime value metrics.",
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_bi_dashboard_mastery",
    data: {
      title: "Power BI & Tableau: Executive Dashboard Design",
      slug: "powerbi-tableau-dashboard-design",
      subtitle: "Craft stunning executive BI dashboards that leadership teams actually use to make million-dollar decisions.",
      description: "Transform raw corporate data into jaw-dropping interactive business intelligence dashboards in Power BI and Tableau. Learn DAX formulas, Star Schema data modeling, and UI/UX design principles tailored for analytics.",
      category: "data-analytics",
      categoryName: "Data Analytics",
      tags: ["PowerBI", "Tableau", "Dashboards", "Business Intelligence"],
      level: "intermediate" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 299900,
      discountPriceInPaise: 179900,
      thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Build enterprise-ready Power BI reports using DAX and Star Schema modeling",
        "Design polished Tableau dashboards following modern visualization guidelines",
        "Connect live data sources with scheduled refreshes and role-level security",
      ],
      requirements: [
        "Basic understanding of spreadsheets (Excel / Google Sheets)",
      ],
      instructor: {
        uid: "trainer_ananya_02",
        name: "Ananya Iyer",
        headline: "AI Research Scientist & Deep Learning Specialist",
        photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_ananya_02",
      status: "published" as CourseStatus,
      isFeatured: false,
      rating: 4.85,
      ratingCount: 210,
      enrollmentCount: 940,
      lessonCount: 3,
      totalDurationMinutes: 165,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Power BI Data Modeling & DAX",
        description: "Star Schema, calculated columns, measures, and time intelligence.",
        order: 1,
        lessons: [
          {
            title: "Data Modeling Foundations for Scalable Reporting",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "pbi_01", durationSeconds: 2700 },
            durationMinutes: 45,
            isPreview: true,
          },
          {
            title: "Essential DAX Measures and Time Intelligence",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "pbi_02", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: false,
          },
          {
            title: "Executive SaaS Dashboard Template (.pbix)",
            order: 3,
            type: "link",
            externalLink: "https://example.com/assets/saas-dashboard.pbix",
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_growth_digital_marketing",
    data: {
      title: "Growth Hacking & Performance Marketing for India",
      slug: "growth-hacking-performance-marketing",
      subtitle: "Acquire your first 100,000 users with zero paid ad budget, plus scale meta and google ads profitably.",
      description: "A battle-tested playbook for founders, marketers, and creators in India. Learn the viral growth loops, UGC content frameworks, organic Instagram / LinkedIn positioning, and CAC-to-LTV performance ad scaling used by Indian unicorns.",
      category: "digital-marketing",
      categoryName: "Digital Marketing",
      tags: ["Marketing", "Growth Hacking", "SEO", "Meta Ads", "Indian Startups"],
      level: "all_levels" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 199900,
      discountPriceInPaise: 99900,
      thumbnailUrl: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Build viral organic distribution loops on Instagram, LinkedIn, and YouTube",
        "Set up profitable Meta & Google Ads campaigns with high-converting creatives",
        "Run A/B landing page tests that double your lead capture rates",
      ],
      requirements: [
        "A smartphone or laptop with access to social media platforms",
      ],
      instructor: {
        uid: "trainer_rohit_03",
        name: "Rohit Mehta",
        headline: "VP Product Growth & Executive Career Coach",
        photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_rohit_03",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.7,
      ratingCount: 380,
      enrollmentCount: 1620,
      lessonCount: 3,
      totalDurationMinutes: 150,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Organic Growth Engines",
        description: "Zero-cost distribution tactics that generate millions of impressions.",
        order: 1,
        lessons: [
          {
            title: "Decoding the 2026 Viral Content Algorithm",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "growth_01", durationSeconds: 2400 },
            durationMinutes: 40,
            isPreview: true,
          },
          {
            title: "Building High-Converting Landing Pages",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "growth_02", durationSeconds: 3000 },
            durationMinutes: 50,
            isPreview: false,
          },
          {
            title: "Swipe File: 50 Best Ad Copy & Headline Formulas",
            order: 3,
            type: "pdf",
            pdfUrl: "https://example.com/assets/marketing-swipe-file.pdf",
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_corporate_communication",
    data: {
      title: "Executive Presence & Corporate English for Techies",
      slug: "executive-presence-corporate-english",
      subtitle: "Speak with clarity, command respect in client meetings, and ace tech leadership interviews.",
      description: "Indian engineers are renowned for their technical prowess, but communication is often the glass ceiling preventing promotion to Architect or Director. This course gives you the exact scripts, body language cues, and speaking frameworks to shine in any professional room.",
      category: "communication-skills",
      categoryName: "Communication Skills",
      tags: ["Communication", "Soft Skills", "Leadership", "Career", "Free"],
      level: "beginner" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 0,
      discountPriceInPaise: 0,
      thumbnailUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Articulate complex technical architectures with crisp, concise phrasing",
        "Handle tough questions from executives, US clients, and stakeholders with poise",
        "Write persuasive engineering design documents (RFCs) and email summaries",
      ],
      requirements: [
        "Basic conversational English",
      ],
      instructor: {
        uid: "trainer_rohit_03",
        name: "Rohit Mehta",
        headline: "VP Product Growth & Executive Career Coach",
        photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_rohit_03",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.9,
      ratingCount: 760,
      enrollmentCount: 3100,
      lessonCount: 3,
      totalDurationMinutes: 135,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: The Art of Technical Storytelling",
        description: "From confusing jargon to crisp executive clarity.",
        order: 1,
        lessons: [
          {
            title: "The PREP Framework for Spontaneous Speaking",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "comm_01", durationSeconds: 2100 },
            durationMinutes: 35,
            isPreview: true,
          },
          {
            title: "Presenting to US and Global Clients without Anxiety",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "comm_02", durationSeconds: 3000 },
            durationMinutes: 50,
            isPreview: true,
          },
          {
            title: "50 Workplace Phrases for Confident Negotiations",
            order: 3,
            type: "pdf",
            pdfUrl: "https://example.com/assets/workplace-phrases.pdf",
            durationMinutes: 50,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_cracking_faang_interviews",
    data: {
      title: "Cracking FAANG & Tier-1 Tech Placement Blueprint",
      slug: "cracking-faang-tech-interviews",
      subtitle: "The ultimate DSA roadmap, resume templates, and behavioral interview masterclass for 20+ LPA packages.",
      description: "Everything you need to secure top offers from Google, Amazon, Microsoft, Uber, and high-growth Indian startups. Master the 75 essential LeetCode patterns, optimize your resume for ATS parsers, and ace HR behavioral rounds.",
      category: "placement-prep",
      categoryName: "Placement Prep",
      tags: ["Placement", "DSA", "FAANG", "Interviews", "LeetCode"],
      level: "advanced" as CourseLevel,
      language: "Tamil" as CourseLanguage,
      priceInPaise: 499900,
      discountPriceInPaise: 299900,
      thumbnailUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Solve complex LeetCode medium/hard problems using patterns (sliding window, two pointers, graphs, DP)",
        "Structure behavioral answers using the STAR method that interviewers love",
        "Craft an ATS-proof single-page tech resume that secures callbacks",
      ],
      requirements: [
        "Basic coding capability in any language (Java, C++, Python, or JavaScript)",
      ],
      instructor: {
        uid: "trainer_rohit_03",
        name: "Rohit Mehta",
        headline: "VP Product Growth & Executive Career Coach",
        photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_rohit_03",
      status: "published" as CourseStatus,
      isFeatured: true,
      rating: 4.92,
      ratingCount: 650,
      enrollmentCount: 2450,
      lessonCount: 4,
      totalDurationMinutes: 240,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: The Top 15 DSA Patterns",
        description: "Master patterns rather than memorizing individual solutions.",
        order: 1,
        lessons: [
          {
            title: "Dynamic Programming Made Intuitive",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "dsa_dp_01", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: true,
          },
          {
            title: "Graph Traversal (BFS/DFS) & Topological Sorting",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "dsa_graphs_02", durationSeconds: 4200 },
            durationMinutes: 70,
            isPreview: false,
          },
        ],
      },
      {
        title: "Module 2: Resume & Mock Behavioral Rounds",
        description: "Turn your projects into high-impact portfolio pieces.",
        order: 2,
        lessons: [
          {
            title: "The Perfect 1-Page Tech Resume Format (with LaTeX template)",
            order: 1,
            type: "pdf",
            pdfUrl: "https://example.com/assets/perfect-tech-resume.pdf",
            durationMinutes: 40,
            isPreview: true,
          },
          {
            title: "Cracking Amazon Leadership Principles & Behavioral Questions",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "amazon_lp_03", durationSeconds: 4200 },
            durationMinutes: 70,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_system_design_interview",
    data: {
      title: "High Scalability System Design for SDE-2 & SDE-3",
      slug: "system-design-sde-interviews",
      subtitle: "Learn how to design distributed architectures handling millions of QPS, caching, sharding, and consensus.",
      description: "Master both Low Level Design (LLD) and High Level Design (HLD). Walk through real-world system designs like WhatsApp, Swiggy, Netflix CDN, and distributed rate limiters.",
      category: "placement-prep",
      categoryName: "Placement Prep",
      tags: ["System Design", "HLD", "LLD", "Distributed Systems", "SDE2"],
      level: "advanced" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 599900,
      discountPriceInPaise: 349900,
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Design distributed message queues (Kafka-style) and write-ahead logs",
        "Choose between SQL vs NoSQL, CAP theorem tradeoffs, and consistent hashing",
        "Ace standard HLD interview questions within 45 minutes",
      ],
      requirements: [
        "2+ years of software engineering experience or strong computer networking fundamentals",
      ],
      instructor: {
        uid: "trainer_vikram_01",
        name: "Vikram Malhotra",
        headline: "Principal Architect & Ex-Google Senior Tech Lead",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_vikram_01",
      status: "published" as CourseStatus,
      isFeatured: false,
      rating: 4.88,
      ratingCount: 430,
      enrollmentCount: 1280,
      lessonCount: 3,
      totalDurationMinutes: 195,
      publishedAt: Timestamp.now(),
    },
    modules: [
      {
        title: "Module 1: Core Distributed Systems Primitives",
        description: "Load balancers, caching tiers, database replication, and sharding.",
        order: 1,
        lessons: [
          {
            title: "Consistent Hashing & Distributed Caching (Redis/Memcached)",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "sys_design_01", durationSeconds: 3900 },
            durationMinutes: 65,
            isPreview: true,
          },
          {
            title: "Designing Swiggy / Zomato Real-Time Delivery Tracking",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "sys_design_02", durationSeconds: 4200 },
            durationMinutes: 70,
            isPreview: false,
          },
          {
            title: "System Design Interview Playbook & Diagrams",
            order: 3,
            type: "pdf",
            pdfUrl: "https://example.com/assets/system-design-playbook.pdf",
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_pending_nlp_llm",
    data: {
      title: "Building LLMs from Scratch with PyTorch & HuggingFace",
      slug: "building-llms-from-scratch",
      subtitle: "Understand attention mechanisms, KV caches, multi-head attention, and fine-tune your own 1B-parameter model.",
      description: "An intensive engineering course taking you from raw matrix operations to training a decoder-only transformer architecture on custom domain text. Ready for admin review.",
      category: "ai-ml",
      categoryName: "AI & Machine Learning",
      tags: ["PyTorch", "Transformers", "NLP", "LLM", "Deep Learning"],
      level: "advanced" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 799900,
      discountPriceInPaise: 549900,
      thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Implement Scaled Dot-Product Attention from scratch in PyTorch",
        "Tokenize and preprocess large-scale corpora with Byte-Pair Encoding",
        "Fine-tune models using FlashAttention-2 and 4-bit quantization",
      ],
      requirements: [
        "Strong Python skills and familiarity with linear algebra & PyTorch tensors",
      ],
      instructor: {
        uid: "trainer_ananya_02",
        name: "Ananya Iyer",
        headline: "AI Research Scientist & Deep Learning Specialist",
        photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_ananya_02",
      status: "pending_review" as CourseStatus,
      isFeatured: false,
      rating: 0,
      ratingCount: 0,
      enrollmentCount: 0,
      lessonCount: 2,
      totalDurationMinutes: 120,
    },
    modules: [
      {
        title: "Module 1: Attention is All You Need",
        description: "Implementing self-attention and positional encodings.",
        order: 1,
        lessons: [
          {
            title: "Mathematics of Scaled Dot-Product Attention",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "llm_01", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: true,
          },
          {
            title: "FlashAttention & Memory Optimizations in GPUs",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "llm_02", durationSeconds: 3600 },
            durationMinutes: 60,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_rejected_web3_crypto",
    data: {
      title: "Web3 Solana & Ethereum Smart Contracts",
      slug: "web3-solana-smart-contracts",
      subtitle: "Build DeFi protocols and token escrow contracts on Rust (Anchor) and Solidity.",
      description: "Learn smart contract engineering on Solana and Ethereum. Build decentralized applications with Web3.js.",
      category: "web-development",
      categoryName: "Web Development",
      tags: ["Web3", "Solana", "Rust", "Solidity", "Crypto"],
      level: "intermediate" as CourseLevel,
      language: "English" as CourseLanguage,
      priceInPaise: 399900,
      discountPriceInPaise: 249900,
      thumbnailUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop",
      promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      learningOutcomes: [
        "Write Solana programs using Rust and the Anchor framework",
        "Deploy and test Solidity contracts with Hardhat",
      ],
      requirements: [
        "Basic programming knowledge in Rust or JavaScript",
      ],
      instructor: {
        uid: "trainer_vikram_01",
        name: "Vikram Malhotra",
        headline: "Principal Architect & Ex-Google Senior Tech Lead",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_vikram_01",
      status: "rejected" as CourseStatus,
      rejectionReason: "Course overview is missing syllabus details for Solana Anchor framework, and lesson 2 video duration metadata is incomplete. Please update requirements and resubmit.",
      isFeatured: false,
      rating: 0,
      ratingCount: 0,
      enrollmentCount: 0,
      lessonCount: 2,
      totalDurationMinutes: 80,
    },
    modules: [
      {
        title: "Module 1: Solana Architecture",
        description: "Accounts, instructions, and programs.",
        order: 1,
        lessons: [
          {
            title: "Solana Account Model vs Ethereum EVM",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "web3_01", durationSeconds: 2400 },
            durationMinutes: 40,
            isPreview: true,
          },
          {
            title: "Drafting Your First Anchor Program",
            order: 2,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "web3_02", durationSeconds: 2400 },
            durationMinutes: 40,
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    id: "course_draft_freelancing_guide",
    data: {
      title: "Freelancing Blueprint for Gen Z Developers: $5k/Month",
      slug: "freelancing-blueprint-developers",
      subtitle: "How to land international clients on Upwork, Contra, and Twitter without bidding on low-paying projects.",
      description: "A complete step-by-step guide on positioning yourself as a premium freelance developer in India for Western clients.",
      category: "placement-prep",
      categoryName: "Placement Prep",
      tags: ["Freelancing", "Career", "Remote Work", "Upwork"],
      level: "beginner" as CourseLevel,
      language: "Tamil" as CourseLanguage,
      priceInPaise: 149900,
      discountPriceInPaise: 99900,
      thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
      learningOutcomes: [
        "Optimize your Upwork and Contra profiles for high-ticket client inbound",
        "Write winning proposals that close $1k+ contracts",
      ],
      requirements: [
        "Basic web development or design portfolio",
      ],
      instructor: {
        uid: "trainer_rohit_03",
        name: "Rohit Mehta",
        headline: "VP Product Growth & Executive Career Coach",
        photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
      trainerId: "trainer_rohit_03",
      status: "draft" as CourseStatus,
      isFeatured: false,
      rating: 0,
      ratingCount: 0,
      enrollmentCount: 0,
      lessonCount: 2,
      totalDurationMinutes: 70,
    },
    modules: [
      {
        title: "Module 1: Positioning & Client Acquisition",
        description: "Stand out from the sea of commodity freelancers.",
        order: 1,
        lessons: [
          {
            title: "Niche Selection & Portfolio Case Studies",
            order: 1,
            type: "video",
            videoMetadata: { provider: "youtube", videoId: "freelance_01", durationSeconds: 2100 },
            durationMinutes: 35,
            isPreview: true,
          },
          {
            title: "Cold Email & Twitter DM Templates That Convert",
            order: 2,
            type: "pdf",
            pdfUrl: "https://example.com/assets/outreach-templates.pdf",
            durationMinutes: 35,
            isPreview: false,
          },
        ],
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting GenZNex Phase 2 Course Seed Script...");

  // 1. Seed Categories
  console.log("\n📁 Seeding 6 Course Categories...");
  for (const cat of CATEGORIES) {
    const { id, ...catData } = cat;
    await db.collection("categories").doc(id).set({
      ...catData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`   ✅ Category seeded: ${cat.name} (${id})`);
  }

  // 2. Seed Users & Custom Claims
  console.log("\n👥 Seeding Users & Setting Firebase Auth Custom Claims...");
  for (const user of SEED_USERS) {
    try {
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        password: "Password@123",
      });
      console.log(`   👤 Auth user created: ${user.email} (${user.uid})`);
    } catch (e: any) {
      if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
        console.log(`   ℹ️ Auth user exists: ${user.email}`);
      } else {
        console.warn(`   ⚠️ Warning creating user ${user.email}:`, e.message);
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: user.role });
    console.log(`   🔑 Custom claim set: { role: "${user.role}" } for ${user.displayName}`);

    // Update Firestore User Profile
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      headline: user.headline || "",
      bio: user.bio || "",
      photoURL: user.photoURL || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // 3. Seed Courses, Modules & Lessons
  console.log("\n📚 Seeding 12 Realistic Courses with Modules & Lessons...");
  for (const course of COURSES) {
    const { id, data, modules } = course;

    // Set course doc
    await db.collection("courses").doc(id).set({
      ...data,
      id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Seed modules and lessons
    for (const mod of modules) {
      const moduleId = `mod_${mod.order}`;
      const modRef = db.collection("courses").doc(id).collection("modules").doc(moduleId);
      
      await modRef.set({
        id: moduleId,
        courseId: id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      for (const lesson of mod.lessons) {
        const lessonId = `les_${mod.order}_${lesson.order}`;
        await modRef.collection("lessons").doc(lessonId).set({
          ...lesson,
          id: lessonId,
          courseId: id,
          moduleId: moduleId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    console.log(`   ✅ Course seeded: [${data.status.toUpperCase()}] "${data.title}" (${modules.length} mods, ${data.lessonCount} lessons)`);
  }

  console.log("\n🎉 Phase 2 Seed Complete! All 6 categories, 5 users, and 12 courses loaded into Emulator.\n");
}

seed().catch((err) => {
  console.error("❌ Seed Script Failed:", err);
  process.exit(1);
});
