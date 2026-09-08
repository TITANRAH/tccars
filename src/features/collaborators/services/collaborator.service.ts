import { prisma } from "@/lib/prisma"
import type { CollaboratorInput } from "@/features/collaborators/schemas/collaborator.schema"

const PAGE_SIZE = 20

export async function listCollaborators(query?: string, page = 1) {
  const where = {
    role: { in: ["ADMIN", "COLLABORATOR"] as ("ADMIN" | "COLLABORATOR")[] },
    ...(query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ active: "desc" }, { firstName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function getCollaborator(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

function toProfileData(input: CollaboratorInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone || null,
    rut: input.rut || null,
    position: input.position || null,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    role: input.role,
  }
}

export function createCollaboratorProfile(
  input: CollaboratorInput,
  passwordHash: string
) {
  return prisma.user.create({
    data: {
      ...toProfileData(input),
      email: input.email.toLowerCase(),
      passwordHash,
      emailVerified: new Date(),
    },
  })
}

export function updateCollaborator(id: string, input: CollaboratorInput) {
  return prisma.user.update({ where: { id }, data: toProfileData(input) })
}

export function setCollaboratorActive(id: string, active: boolean) {
  return prisma.user.update({ where: { id }, data: { active } })
}
