"use client";

import { EmptyState } from "@/frontend/components/ui";
import type { ExamDetail } from "@/shared/types";

export function GradingTab({ exam }: { exam: ExamDetail }) {
  return <EmptyState title="Coming soon" description={`This tab for ${exam.title} is being built.`} />;
}
