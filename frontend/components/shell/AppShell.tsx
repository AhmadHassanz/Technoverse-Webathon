"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Library,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  ShieldCheck,
  Sun,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useAuth } from "@/frontend/lib/auth";
import type { Role } from "@/shared/types";

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const navFor: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Users", short: "Users", icon: Users, match: (p) => p === "/admin" },
    {
      href: "/examiner",
      label: "Examinations",
      short: "Exams",
      icon: ClipboardList,
      match: (p) => p === "/examiner" || p.startsWith("/examiner/exams"),
    },
    {
      href: "/examiner/questions",
      label: "Question bank",
      short: "Bank",
      icon: Library,
      match: (p) => p.startsWith("/examiner/questions"),
    },
  ],
  examiner: [
    {
      href: "/examiner",
      label: "Overview",
      short: "Overview",
      icon: LayoutGrid,
      match: (p) => p === "/examiner" || (p.startsWith("/examiner/exams") && p !== "/examiner/exams/new"),
    },
    {
      href: "/examiner/questions",
      label: "Question bank",
      short: "Bank",
      icon: Library,
      match: (p) => p.startsWith("/examiner/questions"),
    },
    {
      href: "/examiner/exams/new",
      label: "New examination",
      short: "New",
      icon: PlusCircle,
      match: (p) => p === "/examiner/exams/new",
    },
  ],
  candidate: [
    {
      href: "/candidate",
      label: "My examinations",
      short: "Exams",
      icon: BookOpenCheck,
      match: (p) => p === "/candidate",
    },
    {
      href: "/candidate#results",
      label: "Results",
      short: "Results",
      icon: Trophy,
      match: (p) => p.startsWith("/candidate/results"),
    },
  ],
};

const roleLabel: Record<Role, string> = {
  admin: "Administrator",
  examiner: "Examiner",
  candidate: "Candidate",
};

function initials(name?: string) {
  if (!name) return "··";
  const parts = name.replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="ExamCore home">
      <span className="relative flex size-8 items-center justify-center rounded-[10px] bg-lime text-on-lime shadow-[0_6px_18px_-6px_rgb(198_243_107/0.7)] transition-transform group-hover:-rotate-6">
        <GraduationCap className="size-[18px]" strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "display text-[1.3rem] leading-none tracking-[-0.04em]",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        ExamCore
      </span>
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
    <div className="glow-iris relative flex h-full flex-col overflow-hidden bg-night text-white">
      <div className="bg-dots-night pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative px-5 pb-8 pt-6">
        <Logo />
      </div>

      <p className="relative px-6 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-night-mute">
        {roleLabel[role]} workspace
      </p>
      <nav className="relative flex flex-col gap-1 px-3" aria-label="Primary">
        {navFor[role].map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-[12px] px-3 text-[0.875rem] font-medium transition-colors",
                active ? "bg-white/[0.09] text-white" : "text-night-mute hover:bg-white/[0.05] hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span aria-hidden className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-lime" />
              )}
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-[8px] transition-colors",
                  active ? "bg-lime text-on-lime" : "bg-white/[0.06] text-night-mute group-hover:text-white",
                )}
              >
                <Icon className="size-[15px]" strokeWidth={2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mx-3 mt-6 rounded-[14px] border border-night-line bg-white/[0.03] p-4">
        <p className="flex items-center gap-2 text-[0.75rem] font-semibold text-white">
          <ShieldCheck className="size-4 text-lime" /> Secure by design
        </p>
        <p className="mt-1.5 text-[0.75rem] leading-relaxed text-night-mute">
          Autosave, offline recovery and verified reports on every exam.
        </p>
      </div>

      <div className="relative mt-auto border-t border-night-line p-3">
        <div className="flex items-center gap-3 rounded-[12px] p-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cobalt to-[#b06bff] text-[0.75rem] font-semibold text-white">
            {initials(me?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-white">{me?.fullName}</p>
            <p className="truncate text-[0.6875rem] text-night-mute">{me?.email}</p>
          </div>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="flex size-8 items-center justify-center rounded-[8px] text-night-mute transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { me, updatePreferences } = useAuth();
  const dark = me?.preferences.theme === "dark";
  return (
    <button
      type="button"
      onClick={() => void updatePreferences({ theme: dark ? "light" : "dark" }).catch(() => undefined)}
      className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-mute transition-colors hover:text-ink"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { me } = useAuth();
  const items = navFor[role];

  return (
    <div className="min-h-screen bg-parchment md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden md:sticky md:top-0 md:block md:h-screen">
        <SidebarContent role={role} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] flex md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-rise relative h-full w-[280px] max-w-[85vw]">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-5 z-10 rounded-[8px] p-2 text-night-mute hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarContent role={role} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-parchment/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="-ml-1 flex size-9 items-center justify-center rounded-[10px] border border-line bg-surface text-ink md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-[18px]" strokeWidth={1.8} />
            </button>
            <span className="md:hidden">
              <Logo tone="dark" />
            </span>
            <div className="hidden min-w-0 items-center gap-2 text-[0.8125rem] md:flex">
              <span className="truncate font-medium text-ink">COMSATS University Lahore</span>
              <span className="text-line-strong">/</span>
              <span className="truncate text-mute">{roleLabel[role]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-[0.6875rem] font-semibold text-success sm:inline-flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              Systems normal
            </span>
            <ThemeToggle />
            <span
              className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-cobalt to-[#b06bff] text-[0.6875rem] font-semibold text-white md:hidden"
              aria-hidden
            >
              {initials(me?.fullName)}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>

      {/* Phone bottom tab bar */}
      <nav
        aria-label="Primary (mobile)"
        className="pad-safe-bottom fixed inset-x-3 bottom-3 z-50 flex items-center justify-around gap-1 rounded-[20px] border border-night-line bg-night/95 px-2 pt-2 shadow-pop backdrop-blur-xl md:hidden"
      >
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={`m-${item.href}-${item.label}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-[14px] px-2 py-1.5 text-[0.625rem] font-semibold transition-colors",
                active ? "text-white" : "text-night-mute",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  active ? "bg-lime text-on-lime" : "",
                )}
              >
                <Icon className="size-[17px]" strokeWidth={2} />
              </span>
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
