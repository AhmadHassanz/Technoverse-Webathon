"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/frontend/components/shell/AppShell";
import { Skeleton } from "@/frontend/components/ui";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import type { Role } from "@/shared/types";

export function RoleLayout({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    if (me.role !== role) {
      router.replace(roleHome(me.role));
      return;
    }
    setReady(true);
  }, [loading, me, role, router]);

  if (loading || !ready || !me || me.role !== role) {
    return (
      <div className="min-h-screen bg-parchment p-8">
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

  return <AppShell role={role}>{children}</AppShell>;
}
