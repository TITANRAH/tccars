import { prisma } from "@/lib/prisma"
import type { ServicePostInput } from "@/features/catalog-services/schemas/service-post.schema"

export function listServicePosts() {
  return prisma.servicePost.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] })
}

export function listPublishedServicePosts() {
  return prisma.servicePost.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })
}

export function getServicePost(id: string) {
  return prisma.servicePost.findUnique({ where: { id } })
}

export function createServicePost(data: ServicePostInput) {
  return prisma.servicePost.create({
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function updateServicePost(id: string, data: ServicePostInput) {
  return prisma.servicePost.update({
    where: { id },
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function deleteServicePost(id: string) {
  return prisma.servicePost.delete({ where: { id } })
}
