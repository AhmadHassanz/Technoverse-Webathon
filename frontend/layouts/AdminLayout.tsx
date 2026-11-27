"use client";

import { RoleLayout } from "./RoleLayout";

const ROLES = ["admin" as const];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout roles={ROLES}>{children}</RoleLayout>;
}
