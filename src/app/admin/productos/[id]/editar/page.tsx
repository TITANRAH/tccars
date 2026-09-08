import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getProduct } from "@/features/catalog-products/services/product.service"
import { ProductForm } from "@/features/catalog-products/components/product-form"

export const metadata = { title: "Editar producto — Panel admin" }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Editar producto</h1>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: Number(product.price),
          imageUrl: product.imageUrl ?? "",
          stock: product.stock,
          published: product.published,
        }}
      />
    </div>
  )
}
