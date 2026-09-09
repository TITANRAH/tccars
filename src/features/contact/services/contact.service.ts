import { prisma } from "@/lib/prisma"
import type { ContactInput } from "@/features/contact/schemas/contact.schema"

export function saveContactMessage(data: ContactInput) {
  return prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    },
  })
}

const PAGE_SIZE = 20

export type ContactReadFilter = "todos" | "no_leidos" | "leidos"

export async function listContactMessages(
  query?: string,
  page = 1,
  readFilter: ContactReadFilter = "todos"
) {
  const where = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { message: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(readFilter === "no_leidos"
      ? { status: "NUEVO" as const }
      : readFilter === "leidos"
        ? { status: { not: "NUEVO" as const } }
        : {}),
  }

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contactMessage.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function markContactMessageRead(id: string) {
  return prisma.contactMessage.update({ where: { id }, data: { status: "LEIDO" } })
}
