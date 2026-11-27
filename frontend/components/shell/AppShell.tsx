"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useAuth } from "@/frontend/lib/auth";
import type { Role } from "@/shared/types";

type NavItem = { href: string; label: string; match: (path: string) => boolean };

const navFor: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Users", match: (p) => p === "/admin" },
    { href: "/admin?view=access", label: "Access & roles", match: () => false },
  ],
  examiner: [
    { href: "/examiner", label: "Overview", match: (p) => p === "/examiner" },
    {
      href: "/examiner/questions",
      label: "Question bank",
      match: (p) => p.startsWith("/examiner/questions"),
    },
    {
      href: "/examiner",
      label: "Examinations",
      match: (p) => p.startsWith("/examiner/exams"),
    },
  ],
  candidate: [
    {
      href: "/candidate",
      label: "My examinations",
      match: (p) => p === "/candidate",
    },
    { href: "/candidate#results", label: "Results", match: () => false },
  ],
};

const roleLabel: Record<Role, string> = {
  admin: "Administrator workspace",
  examiner: "Examiner workspace",
  candidate: "Candidate workspace",
};

const roleAccount: Record<Role, string> = {
  admin: "Administrator account",
  examiner: "Examiner account",
  candidate: "Candidate account",
};

function Brand() {
  return (
    <Link href="/" className="inline-flex flex-col">
      <span className="display text-[1.7rem] leading-none text-cobalt">ExamCore</span>
    </Link>
  );
}

function SidebarContent({
  role,
  pathname,
  onNavigate,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { logout, me } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="px-7 pb-10 pt-7">
        <Brand />
        <p className="mt-3 text-[0.625rem] uppercase tracking-[0.12em] text-mute">
          {roleLabel[role]}
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="Primary">
        {navFor[role].map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-11 items-center rounded-md px-4 text-[0.9rem] transition-colors",
                active
                  ? "bg-cobalt font-medium text-white"
                  : "text-ink hover:bg-surface/70",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-7 pb-8 pt-10">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.1em] text-cobalt">
          Secure by design
        </p>
        <p className="mt-1.5 text-[0.8125rem] text-mute">Institution workspace</p>
        <p className="mt-1 truncate text-[0.75rem] text-mute/80">{me?.fullName}</p>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="mt-4 text-[0.875rem] font-medium text-cobalt hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const institution = "COMSATS University Lahore";

  return (
    <div className="min-h-screen bg-parchment md:grid md:grid-cols-[196px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen bg-parchment md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto">
        <SidebarContent role={role} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] flex md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[260px] border-r border-line bg-parchment">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-2 text-mute hover:bg-surface"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              role={role}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:h-20 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="-ml-1 rounded-md p-2 text-ink md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" strokeWidth={1.7} />
            </button>
            <Link href="/" className="display text-xl text-cobalt md:hidden">
              ExamCore
            </Link>
            <p className="hidden text-[0.8125rem] text-ink sm:block">{institution}</p>
          </div>
          <p className="text-[0.75rem] text-mute sm:text-[0.8125rem]">{roleAccount[role]}</p>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
