import { prisma } from "@/lib/prisma"
import type { ServicePostInput } from "@/features/catalog-services/schemas/service-post.schema"

const PAGE_SIZE = 20

export async function listServicePosts(query?: string, page = 1) {
  const where = query
    ? { title: { contains: query, mode: "insensitive" as const } }
    : {}

  const [items, total] = await Promise.all([
    prisma.servicePost.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.servicePost.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
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

export function getPublishedServicePostBySlug(slug: string) {
  return prisma.servicePost.findFirst({ where: { slug, published: true } })
}

/** El servicio "estrella" que se resalta en grande en la portada, si hay uno publicado. */
export function getFeaturedServicePost() {
  return prisma.servicePost.findFirst({ where: { published: true, featured: true } })
}

/**
 * Solo puede haber un servicio "estrella" a la vez: si este se marca como
 * featured, se desmarcan todos los demás en la misma transacción.
 */
export async function createServicePost(data: ServicePostInput) {
  if (data.featured) {
    return prisma.$transaction(async (tx) => {
      await tx.servicePost.updateMany({ where: { featured: true }, data: { featured: false } })
      return tx.servicePost.create({ data: { ...data, imageUrl: data.imageUrl || null } })
    })
  }
  return prisma.servicePost.create({
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export async function updateServicePost(id: string, data: ServicePostInput) {
  if (data.featured) {
    return prisma.$transaction(async (tx) => {
      await tx.servicePost.updateMany({
        where: { featured: true, NOT: { id } },
        data: { featured: false },
      })
      return tx.servicePost.update({ where: { id }, data: { ...data, imageUrl: data.imageUrl || null } })
    })
  }
  return prisma.servicePost.update({
    where: { id },
    data: { ...data, imageUrl: data.imageUrl || null },
  })
}

export function deleteServicePost(id: string) {
  return prisma.servicePost.delete({ where: { id } })
}
