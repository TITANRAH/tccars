"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { deleteProductAction } from "@/features/catalog-products/actions/product.actions"
import { formatCLP } from "@/lib/format"

type ProductRow = {
  id: string
  name: string
  price: number
  stock: number
  published: boolean
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      await deleteProductAction(id)
      toast.success("Producto eliminado")
    })
  }

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay productos publicados.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{formatCLP(product.price)}</TableCell>
            <TableCell>{product.stock}</TableCell>
            <TableCell>
              <Badge variant={product.published ? "default" : "secondary"}>
                {product.published ? "Publicado" : "Borrador"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/productos/${product.id}/editar`}>Editar</Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(product.id, product.name)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
