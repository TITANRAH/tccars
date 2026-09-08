import { prisma } from "@/lib/prisma"

/**
 * Control de acceso para el workflow de WhatsApp: reutiliza los mismos
 * usuarios que el admin ya gestiona en /admin/colaboradores (ADMIN,
 * COLLABORATOR) y /colaborador/vehiculos (CLIENT) — no hay una lista
 * separada que mantener sincronizada a mano. Un teléfono que no coincide
 * con ningún usuario activo se trata como anónimo (solo consultas
 * genéricas, sin acceso a datos de cliente).
 */
export function findUserRoleByPhone(phone: string) {
  return prisma.user.findFirst({
    where: { phone, active: true },
    select: { id: true, firstName: true, lastName: true, role: true },
  })
}
