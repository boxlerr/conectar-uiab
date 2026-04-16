import { redirect } from "next/navigation";

// Particular (proveedor) detail pages are now served from /empresas/[slug],
// which detects the entity type and renders the right layout.
export default async function ProveedorDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/empresas/${slug}`);
}
