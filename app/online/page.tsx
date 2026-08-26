"use client";

import { OnlineScreen } from "@/components/online-screen";
import { RequireAuth } from "@/components/require-auth";
import { ONLINE_ROLES } from "@/lib/roles";

export default function OnlinePage() {
  return (
    <RequireAuth roles={ONLINE_ROLES}>
      <OnlineScreen />
    </RequireAuth>
  );
}
