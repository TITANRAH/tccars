import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import type { MaintenanceInput } from "@/features/maintenances/schemas/maintenance.schema"

const STAFF_SELECT = { id: true, firstName: true, lastName: true } as const
const CLIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const

export function findStaffByPhone(phone: string) {
  return prisma.user.findFirst({
    where: { phone, role: { in: ["ADMIN", "COLLABORATOR"] }, active: true },
  })
}

export function listStaffUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COLLABORATOR"] }, active: true },
    select: STAFF_SELECT,
    orderBy: { firstName: "asc" },
  })
}

/**
 * Para que n8n pueda resolver a qué mantención se refiere el colaborador al
 * cerrarla por voz — dice la patente (y opcionalmente su teléfono), n8n lista
 * las mantenciones abiertas de ese auto y, si hay más de una, le pregunta al
 * colaborador cuál (por folio) antes de hacer el PATCH.
 */
export function listOpenMaintenancesForN8n(vehicleId: string, collaboratorId?: string | null) {
  return prisma.maintenance.findMany({
    where: {
      vehicleId,
      status: { in: ["AGENDADA", "EN_PROCESO"] },
      ...(collaboratorId ? { collaboratorId } : {}),
    },
    select: {
      id: true,
      folio: true,
      description: true,
      status: true,
      createdAt: true,
      collaborator: { select: STAFF_SELECT },
    },
    orderBy: { createdAt: "desc" },
  })
}

const MAINTENANCE_PAGE_SIZE = 20

export async function listMaintenancesForVehicle(vehicleId: string, query?: string, page = 1) {
  const where = {
    vehicleId,
    ...(query ? { description: { contains: query, mode: "insensitive" as const } } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: { images: true, collaborator: { select: STAFF_SELECT } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MAINTENANCE_PAGE_SIZE,
      take: MAINTENANCE_PAGE_SIZE,
    }),
    prisma.maintenance.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: MAINTENANCE_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / MAINTENANCE_PAGE_SIZE)),
  }
}

export function getMaintenance(id: string) {
  return prisma.maintenance.findUnique({
    where: { id },
    include: {
      images: true,
      collaborator: { select: STAFF_SELECT },
      vehicle: { include: { client: { select: CLIENT_SELECT } } },
    },
  })
}

export type MaintenanceWithRelations = NonNullable<Awaited<ReturnType<typeof getMaintenance>>>

/**
 * Última mantención de este vehículo que dejó registrado kilometraje, para
 * poder estimar cuándo se acerca la próxima (ver `lib/maintenance-alerts.ts`).
 */
export function getLatestMileageRecord(vehicleId: string) {
  return prisma.maintenance.findFirst({
    where: { vehicleId, mileage: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { mileage: true, nextServiceMileage: true, createdAt: true, scheduledAt: true },
  })
}

export function listMaintenancesForCollaborator(collaboratorId: string) {
  return prisma.maintenance.findMany({
    where: { collaboratorId },
    include: { vehicle: true },
    orderBy: { scheduledAt: "asc" },
  })
}

export function listAllMaintenances() {
  return prisma.maintenance.findMany({
    include: { vehicle: true, collaborator: { select: STAFF_SELECT } },
    orderBy: { createdAt: "desc" },
  })
}

function toData(input: MaintenanceInput) {
  return {
    vehicleId: input.vehicleId,
    appointmentId: input.appointmentId || null,
    type: input.type,
    status: input.status,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    collaboratorId: input.collaboratorId || null,
    description: input.description,
    mileage: input.mileage ?? null,
    nextServiceMileage: input.nextServiceMileage ?? null,
    laborCost: input.laborCost,
    partsCost: input.partsCost,
    additionalCost: input.additionalCost,
    totalCost: input.laborCost + input.partsCost + input.additionalCost,
    paymentStatus: input.paymentStatus,
  }
}

export function createMaintenance(input: MaintenanceInput) {
  return prisma.maintenance.create({ data: toData(input) })
}

export function updateMaintenance(id: string, input: MaintenanceInput) {
  return prisma.maintenance.update({ where: { id }, data: toData(input) })
}

export function deleteMaintenance(id: string) {
  return prisma.maintenance.delete({ where: { id } })
}

export const MAX_IMAGES_PER_MAINTENANCE = 20

export class MaintenanceImageLimitError extends Error {}

export async function addMaintenanceImage(maintenanceId: string, url: string) {
  const count = await prisma.maintenanceImage.count({ where: { maintenanceId } })
  if (count >= MAX_IMAGES_PER_MAINTENANCE) {
    throw new MaintenanceImageLimitError(
      `Esta mantención ya tiene el máximo de ${MAX_IMAGES_PER_MAINTENANCE} imágenes`
    )
  }
  return prisma.maintenanceImage.create({ data: { maintenanceId, url } })
}

export function deleteMaintenanceImage(id: string) {
  return prisma.maintenanceImage.delete({ where: { id } })
}

type N8nMaintenanceFields = {
  description?: string
  type?: "MANTENCION" | "VISITA_TECNICA"
  status?: "AGENDADA" | "EN_PROCESO" | "COMPLETADA" | "CANCELADA"
  paymentStatus?: "PENDIENTE" | "PAGADO" | "PARCIAL"
  collaboratorId?: string | null
  mileage?: number | null
  nextServiceMileage?: number | null
  laborCost?: number
  partsCost?: number
  additionalCost?: number
}

function n8nSharedFields(input: N8nMaintenanceFields) {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
    ...(input.collaboratorId !== undefined ? { collaboratorId: input.collaboratorId } : {}),
    ...(input.mileage !== undefined ? { mileage: input.mileage } : {}),
    ...(input.nextServiceMileage !== undefined
      ? { nextServiceMileage: input.nextServiceMileage }
      : {}),
  }
}

export function createMaintenanceForN8n(vehicleId: string, input: N8nMaintenanceFields) {
  const laborCost = input.laborCost ?? 0
  const partsCost = input.partsCost ?? 0
  const additionalCost = input.additionalCost ?? 0
  return prisma.maintenance.create({
    data: {
      vehicleId,
      description: input.description ?? "",
      // El trabajo recién está comenzando cuando n8n crea el registro (voz del
      // colaborador) — se cierra explícitamente con COMPLETADA vía el PATCH
      // cuando el colaborador dicta que terminó, sin importar cuántos días pase.
      status: "EN_PROCESO",
      ...n8nSharedFields(input),
      laborCost,
      partsCost,
      additionalCost,
      totalCost: laborCost + partsCost + additionalCost,
    },
  })
}

/**
 * A diferencia de crear, aquí los costos son parciales: si n8n solo manda
 * `partsCost`, no queremos borrar el `laborCost` ya guardado. Por eso se
 * trae el registro actual y se recalcula el total con los valores mezclados.
 */
export async function updateMaintenanceForN8n(id: string, input: N8nMaintenanceFields) {
  const current = await prisma.maintenance.findUniqueOrThrow({ where: { id } })
  const laborCost = input.laborCost ?? Number(current.laborCost)
  const partsCost = input.partsCost ?? Number(current.partsCost)
  const additionalCost = input.additionalCost ?? Number(current.additionalCost)

  return prisma.maintenance.update({
    where: { id },
    data: {
      ...n8nSharedFields(input),
      laborCost,
      partsCost,
      additionalCost,
      totalCost: laborCost + partsCost + additionalCost,
    },
  })
}

/**
 * Genera el token la primera vez que se pide compartir por WhatsApp (no al
 * crear la mantención — la mayoría nunca se comparte así). Es una URL sin
 * login, así que el token debe ser impredecible: 32 bytes al azar.
 */
export async function ensureShareToken(id: string) {
  const current = await prisma.maintenance.findUniqueOrThrow({
    where: { id },
    select: { shareToken: true },
  })
  if (current.shareToken) return current.shareToken

  const token = randomBytes(32).toString("hex")
  await prisma.maintenance.update({ where: { id }, data: { shareToken: token } })
  return token
}

export class MaintenanceNotFoundError extends Error {}

export async function linkFicha(
  identifier: { maintenanceId: string } | { patente: string },
  driveFileId: string,
  driveUrl?: string
) {
  if ("maintenanceId" in identifier) {
    return prisma.maintenance.update({
      where: { id: identifier.maintenanceId },
      data: { fichaDriveFileId: driveFileId, fichaUrl: driveUrl ?? null },
    })
  }

  // Sin maintenanceId explícito (ej. flujo de voz por patente): se asocia
  // a la mantención más reciente de ese vehículo, no a todas.
  const latest = await prisma.maintenance.findFirst({
    where: { vehicle: { patente: identifier.patente.toUpperCase() } },
    orderBy: { createdAt: "desc" },
  })

  if (!latest) {
    throw new MaintenanceNotFoundError(
      `No hay mantenciones registradas para la patente ${identifier.patente}`
    )
  }

  return prisma.maintenance.update({
    where: { id: latest.id },
    data: { fichaDriveFileId: driveFileId, fichaUrl: driveUrl ?? null },
  })
}
