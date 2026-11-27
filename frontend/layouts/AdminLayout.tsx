"use client";

import { RoleLayout } from "./RoleLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}
