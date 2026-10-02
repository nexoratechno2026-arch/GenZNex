"use client";

import React, { use } from "react";
import { CourseWizard } from "@/components/trainer/CourseWizard";

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const resolvedParams = use(params);
  return <CourseWizard initialCourseId={resolvedParams.id} />;
}
