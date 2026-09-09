import { prisma } from "@/lib/prisma"
import type { FaqInput } from "@/features/faq/schemas/faq.schema"

const PAGE_SIZE = 20

export async function listFaqs(query?: string, page = 1) {
  const where = query
    ? { question: { contains: query, mode: "insensitive" as const } }
    : {}

  const [items, total] = await Promise.all([
    prisma.faqEntry.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.faqEntry.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function listPublishedFaqs() {
  return prisma.faqEntry.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })
}

export function getFaq(id: string) {
  return prisma.faqEntry.findUnique({ where: { id } })
}

export function createFaq(data: FaqInput) {
  return prisma.faqEntry.create({ data })
}

export function updateFaq(id: string, data: FaqInput) {
  return prisma.faqEntry.update({ where: { id }, data })
}

export function deleteFaq(id: string) {
  return prisma.faqEntry.delete({ where: { id } })
}
