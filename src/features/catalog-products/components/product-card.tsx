import Image from "next/image"
import type { Product } from "@/generated/prisma/client"
import { formatCLP } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      {product.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-muted text-4xl font-black text-primary/40">
          TC
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
          {outOfStock ? <Badge variant="secondary">Sin stock</Badge> : null}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-3 text-base font-bold text-primary">{formatCLP(product.price)}</p>
      </div>
    </div>
  )
}
