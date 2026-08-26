"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/components/auth-provider";
import { PageLoading } from "@/components/notice";
import { ThemeToggle } from "@/components/theme-toggle";
import { homePath } from "@/lib/roles";

export default function LoginPage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace(homePath(user.role));
  }, [ready, user, router]);

  if (!ready || user) return <PageLoading />;

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-background text-on-surface">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login-bg-wide.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-background/50 dark:bg-background/80" />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-h1 tracking-tight text-on-surface">PLATINUM</h1>
          <p className="text-body text-secondary">Система управления</p>
        </div>

        <div className="rounded-lg border border-border bg-surface/95 p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-sm">
          <LoginForm />
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 label-caps text-secondary">
          <span>© 2024 PLATINUM CRM</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
