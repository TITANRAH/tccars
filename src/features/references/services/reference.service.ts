import { prisma } from "@/lib/prisma"
import type { ReferenceInput } from "@/features/references/schemas/reference.schema"

export function listReferences() {
  return prisma.reference.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] })
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
