"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/frontend/components/shell/AppShell";
import { Skeleton } from "@/frontend/components/ui";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import type { Role } from "@/shared/types";

/**
 * Guard + shell for a role area. This guard is only for a nice UX:
 * the backend checks the role on every API call anyway.
 */
export function RoleLayout({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const allowed = Boolean(me && roles.includes(me.role));

  useEffect(() => {
    if (loading) return;
    if (!me) router.replace("/login");
    else if (!roles.includes(me.role)) router.replace(roleHome(me.role));
  }, [loading, me, roles, router]);

  if (loading || !me || !allowed) {
    return (
      <div className="min-h-screen bg-parchment p-8" aria-busy="true" aria-label="Loading">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="mt-6 h-72" />
      </div>
    );
  }

  return <AppShell role={me.role}>{children}</AppShell>;
}
