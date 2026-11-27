"use client";

import { RoleLayout } from "./RoleLayout";

const ROLES = ["candidate" as const];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={ROLES}>{children}</RoleLayout>;
}
