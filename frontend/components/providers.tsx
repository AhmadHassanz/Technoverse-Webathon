"use client";

import { AuthProvider } from "@/frontend/lib/auth";
import { ToastProvider } from "@/frontend/lib/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
