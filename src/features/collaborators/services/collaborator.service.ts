import { prisma } from "@/lib/prisma"
import type { CollaboratorInput } from "@/features/collaborators/schemas/collaborator.schema"

export function listCollaborators() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COLLABORATOR"] } },
    orderBy: [{ active: "desc" }, { firstName: "asc" }],
  })
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
