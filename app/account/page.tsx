"use client";

import { AccountScreen } from "@/components/account-screen";
import { RequireAuth } from "@/components/require-auth";

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountScreen />
    </RequireAuth>
  );
}
