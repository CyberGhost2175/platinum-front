"use client";

import { WarehouseScreen } from "@/components/warehouse-screen";
import { RequireAuth } from "@/components/require-auth";
import { WAREHOUSE_ROLES } from "@/lib/roles";

export default function SkladPage() {
  return (
    <RequireAuth roles={WAREHOUSE_ROLES}>
      <WarehouseScreen />
    </RequireAuth>
  );
}
