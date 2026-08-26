"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";
import { PageLoading } from "./notice";
import { homePath } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(homePath(user.role));
    }
  }, [ready, user, roles, router]);

  if (!ready || !user) return <PageLoading />;
  if (roles && !roles.includes(user.role)) return <PageLoading />;
  return <>{children}</>;
}
