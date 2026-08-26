"use client";

import { PosScreen } from "@/components/pos-screen";
import { RequireAuth } from "@/components/require-auth";
import { POS_ROLES } from "@/lib/roles";

export default function KassaPage() {
  return (
    <RequireAuth roles={POS_ROLES}>
      <PosScreen />
    </RequireAuth>
  );
}
