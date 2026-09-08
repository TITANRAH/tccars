import { prisma } from "@/lib/prisma"
import type { ReferenceInput } from "@/features/references/schemas/reference.schema"

const PAGE_SIZE = 20

export async function listReferences(query?: string, page = 1) {
  const where = query
    ? { authorName: { contains: query, mode: "insensitive" as const } }
    : {}

  const [items, total] = await Promise.all([
    prisma.reference.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.reference.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function listPublishedReferences() {
  return prisma.reference.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })
}

export function getReference(id: string) {
  return prisma.reference.findUnique({ where: { id } })
}

export function createReference(data: ReferenceInput) {
  return prisma.reference.create({
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function updateReference(id: string, data: ReferenceInput) {
  return prisma.reference.update({
    where: { id },
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function deleteReference(id: string) {
  return prisma.reference.delete({ where: { id } })
}
