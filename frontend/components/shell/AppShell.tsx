"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenCheck,
  ClipboardList,
  LayoutGrid,
  Library,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useAuth } from "@/frontend/lib/auth";
import { ThemePicker } from "@/frontend/components/shell/ThemePicker";
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

/** A link like "/candidate#results" on the page we are already on: Next.js does nothing, so scroll to the section ourselves. */
function scrollToHash(e: React.MouseEvent, href: string, pathname: string) {
  const [path, hash] = href.split("#");
  if (!hash || path !== pathname) return; // other pages: normal navigation (the page scrolls itself once loaded)
  e.preventDefault();
  document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", href);
}

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
      <span
        aria-hidden
        className={cn(
          "grid size-[18px] grid-cols-2 gap-[3px] transition-transform duration-300 ease-out group-hover:rotate-90",
          tone === "light" ? "text-lime" : "text-ink",
        )}
      >
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current opacity-35" />
      </span>
      <span
        className={cn(
          "text-[1.2rem] font-semibold leading-none tracking-[-0.03em]",
          tone === "light" ? "text-lime" : "text-ink",
        )}
      >
        examcore
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
    <div className="relative flex h-full flex-col overflow-hidden border-r border-line bg-paper text-ink">
      <div className="relative px-6 pb-9 pt-6">
        <Logo tone="dark" />
      </div>

      <p className="relative px-6 pb-2 text-[0.8125rem] text-mute">{roleLabel[role]} workspace</p>
      <nav className="relative flex flex-col gap-1 px-3" aria-label="Primary">
        {navFor[role].map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={(e) => {
                scrollToHash(e, item.href, pathname);
                onNavigate?.();
              }}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-full border px-4 text-[0.9375rem] transition-colors duration-200",
                active
                  ? "border-line bg-surface font-medium text-ink shadow-card"
                  : "border-transparent text-mute hover:bg-sand hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("size-[17px]", active ? "text-ink" : "text-mute group-hover:text-ink")} strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mx-4 mt-8 rounded-[16px] border border-line bg-surface p-4">
        <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
          <ShieldCheck className="size-4 text-accent-ink" strokeWidth={1.8} /> Secure by design
        </p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-mute">
          Autosave, offline recovery and verified reports on every exam.
        </p>
      </div>

      <div className="relative mt-auto border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-[12px] p-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-night text-[0.75rem] font-medium text-lime">
            {initials(me?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.875rem] font-medium text-ink">{me?.fullName}</p>
            <p className="truncate text-[0.75rem] text-mute">{me?.email}</p>
          </div>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="flex size-8 items-center justify-center rounded-full text-mute transition-colors hover:bg-sand hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
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
              className="absolute right-3 top-5 z-10 rounded-full p-2 text-mute transition-colors hover:bg-sand hover:text-ink"
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
              className="-ml-1 flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-[18px]" strokeWidth={1.8} />
            </button>
            <span className="md:hidden">
              <Logo tone="dark" />
            </span>
            <div className="hidden min-w-0 items-center gap-2 text-[0.8125rem] md:flex">
              <span className="truncate font-medium text-ink">{roleLabel[role]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemePicker />
            <span
              className="flex size-9 items-center justify-center rounded-full bg-night text-[0.6875rem] font-medium text-lime md:hidden"
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
        className="pad-safe-bottom fixed inset-x-3 bottom-3 z-50 flex items-center justify-around gap-1 rounded-[24px] border border-line bg-surface/95 px-2 pt-2 shadow-pop backdrop-blur-xl md:hidden"
      >
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={`m-${item.href}-${item.label}`}
              href={item.href}
              onClick={(e) => scrollToHash(e, item.href, pathname)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-[14px] px-2 py-1.5 text-[0.6875rem] font-medium transition-colors",
                active ? "text-ink" : "text-mute",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  active ? "bg-cobalt text-on-cobalt" : "",
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
