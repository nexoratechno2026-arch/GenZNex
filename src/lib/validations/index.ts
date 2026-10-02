import { z } from "zod";

export const UserRoleSchema = z.enum(["student", "trainer", "admin"]);

export const CourseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  subtitle: z.string().min(10, "Subtitle must be at least 10 characters").max(200),
  description: z.string().min(30, "Description must be at least 30 characters"),
  priceInInr: z.number().int().nonnegative("Price must be a positive integer in INR"),
  originalPriceInInr: z.number().int().optional(),
  category: z.enum(["Full Stack", "AI & GenAI", "Product Design", "Cybersecurity", "DevOps & Cloud"]),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  durationHours: z.number().positive(),
  totalLessons: z.number().int().positive(),
  tags: z.array(z.string()).min(1, "At least one tag required"),
  features: z.array(z.string()).min(1, "At least one feature required"),
});

export const CreateOrderInputSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const UserProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  headline: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
});
