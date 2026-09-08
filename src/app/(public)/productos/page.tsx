import { listPublishedProducts } from "@/features/catalog-products/services/product.service"
import { ProductCard } from "@/features/catalog-products/components/product-card"
import { FadeIn } from "@/components/motion/fade-in"

export const metadata = { title: "Productos — TC Cars" }

export default async function ProductsPage() {
  const products = await listPublishedProducts()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <FadeIn className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground">Productos</h1>
        <p className="mt-2 text-muted-foreground">Repuestos y accesorios disponibles en tienda.</p>
      </FadeIn>
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground">Pronto publicaremos productos.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <FadeIn key={product.id} delay={i * 0.05}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}
