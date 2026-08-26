"use client";

import { ProductFormScreen } from "@/components/product-form-screen";
import { RequireAuth } from "@/components/require-auth";
import { WAREHOUSE_WRITE_ROLES } from "@/lib/roles";

export default function NewProductPage() {
  return (
    <RequireAuth roles={WAREHOUSE_WRITE_ROLES}>
      <ProductFormScreen />
    </RequireAuth>
  );
}
