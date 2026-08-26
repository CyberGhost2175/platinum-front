"use client";

import { ShiftScreen } from "@/components/shift-screen";
import { RequireAuth } from "@/components/require-auth";
import { SHIFT_ROLES } from "@/lib/roles";

export default function SmenaPage() {
  return (
    <RequireAuth roles={SHIFT_ROLES}>
      <ShiftScreen />
    </RequireAuth>
  );
}
