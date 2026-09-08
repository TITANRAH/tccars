import { prisma } from "@/lib/prisma"
import type { ContactInput } from "@/features/contact/schemas/contact.schema"

export function saveContactMessage(data: ContactInput) {
  return prisma.contactMessage.create({
    data: { ...data, phone: data.phone || null },
  })
}

export function listContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } })
}

export function markContactMessageRead(id: string) {
  return prisma.contactMessage.update({ where: { id }, data: { status: "LEIDO" } })
}
