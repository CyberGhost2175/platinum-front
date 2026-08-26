"use client";

import { useParams } from "next/navigation";
import { ProductFormScreen } from "@/components/product-form-screen";
import { RequireAuth } from "@/components/require-auth";
import { WAREHOUSE_WRITE_ROLES } from "@/lib/roles";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth roles={WAREHOUSE_WRITE_ROLES}>
      <ProductFormScreen productId={params.id} />
    </RequireAuth>
  );
}
