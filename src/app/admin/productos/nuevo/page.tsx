import { requireRole } from "@/lib/auth-guards"
import { ProductForm } from "@/features/catalog-products/components/product-form"

export const metadata = { title: "Nuevo producto — Panel admin" }

export default async function NewProductPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Nuevo producto</h1>
      <ProductForm />
    </div>
  )
}
