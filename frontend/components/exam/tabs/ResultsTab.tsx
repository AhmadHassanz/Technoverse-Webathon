"use client";

import { EmptyState } from "@/frontend/components/ui";
import type { Exam, ExamDetail } from "@/shared/types";

export function ResultsTab({ exam }: { exam: ExamDetail; onPublished: (e: Exam) => void }) {
  return <EmptyState title="Coming soon" description={`Results for ${exam.title} are being built.`} />;
}
