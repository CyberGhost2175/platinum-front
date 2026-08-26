"use client";

import { SettingsScreen } from "@/components/settings-screen";
import { RequireAuth } from "@/components/require-auth";
import { USERS_ROLES } from "@/lib/roles";

export default function SettingsPage() {
  return (
    <RequireAuth roles={USERS_ROLES}>
      <SettingsScreen />
    </RequireAuth>
  );
}
