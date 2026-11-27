"use client";

import { RoleLayout } from "./RoleLayout";

export default function ExaminerLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role="examiner">{children}</RoleLayout>;
}
