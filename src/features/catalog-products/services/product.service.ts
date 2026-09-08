import { prisma } from "@/lib/prisma"
import type { ProductInput } from "@/features/catalog-products/schemas/product.schema"

const PAGE_SIZE = 20

export async function listProducts(query?: string, page = 1) {
  const where = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {}

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
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
