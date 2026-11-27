"use client";

import { RoleLayout } from "./RoleLayout";

// Admins can also use the examiner area (route table: "examiner, admin").
const ROLES = ["examiner" as const, "admin" as const];

export default function ExaminerLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={ROLES}>{children}</RoleLayout>;
}
