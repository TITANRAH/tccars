import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listProducts } from "@/features/catalog-products/services/product.service"
import { ProductsTable } from "@/features/catalog-products/components/products-table"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Productos — Panel admin" }

export default async function AdminProductsPage() {
  await requireRole("ADMIN")
  const products = await listProducts()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button asChild>
          <Link href="/admin/productos/nuevo">+ Nuevo producto</Link>
        </Button>
      </div>
      <ProductsTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
          published: p.published,
        }))}
      />
    </div>
  )
}
