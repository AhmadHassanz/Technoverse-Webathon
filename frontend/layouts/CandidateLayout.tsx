"use client";

import { RoleLayout } from "./RoleLayout";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role="candidate">{children}</RoleLayout>;
}
