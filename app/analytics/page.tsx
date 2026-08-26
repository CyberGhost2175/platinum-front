"use client";

import { AnalyticsScreen } from "@/components/analytics-screen";
import { RequireAuth } from "@/components/require-auth";
import { ANALYTICS_ROLES } from "@/lib/roles";

export default function AnalyticsPage() {
  return (
    <RequireAuth roles={ANALYTICS_ROLES}>
      <AnalyticsScreen />
    </RequireAuth>
  );
}
