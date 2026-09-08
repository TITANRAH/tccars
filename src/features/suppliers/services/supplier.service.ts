import { prisma } from "@/lib/prisma"
import type { SupplierInput } from "@/features/suppliers/schemas/supplier.schema"

const PAGE_SIZE = 20

export async function listSuppliers(query?: string, page = 1) {
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.supplier.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function listActiveSuppliers() {
  return prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } })
}

export function getSupplier(id: string) {
  return prisma.supplier.findUnique({ where: { id } })
}

export function createSupplier(data: SupplierInput) {
  return prisma.supplier.create({ data: { ...data, specialty: data.specialty || null, phone: data.phone || null } })
}

export function updateSupplier(id: string, data: SupplierInput) {
  return prisma.supplier.update({
    where: { id },
    data: { ...data, specialty: data.specialty || null, phone: data.phone || null },
  })
}

export function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } })
}
