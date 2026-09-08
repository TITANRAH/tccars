import { prisma } from "@/lib/prisma"
import type { ProductInput } from "@/features/catalog-products/schemas/product.schema"

export function listProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } })
}

export function listPublishedProducts() {
  return prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })
}

export function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } })
}

export function createProduct(data: ProductInput) {
  return prisma.product.create({ data: { ...data, imageUrl: data.imageUrl || null } })
}

export function updateProduct(id: string, data: ProductInput) {
  return prisma.product.update({
    where: { id },
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } })
}
