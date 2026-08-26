import { redirect } from "next/navigation";

export default async function CatalogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sklad/${id}/edit`);
}
