import { prisma } from "@/lib/prisma"
import type { AppointmentInput } from "@/features/appointments/schemas/appointment.schema"
import { normalizePatente } from "@/features/vehicles/schemas/vehicle.schema"

const STAFF_SELECT = { id: true, firstName: true, lastName: true } as const
const CLIENT_SELECT = { id: true, firstName: true, lastName: true, email: true } as const

export function listAllAppointments(includeFinished = false) {
  return prisma.appointment.findMany({
    where: includeFinished ? {} : { status: { notIn: ["COMPLETADA", "CANCELADA"] } },
    include: {
      vehicle: true,
      collaborator: { select: STAFF_SELECT },
      client: { select: CLIENT_SELECT },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

export function listAppointmentsForCollaborator(collaboratorId: string, includeFinished = false) {
  return prisma.appointment.findMany({
    where: {
      collaboratorId,
      ...(includeFinished ? {} : { status: { notIn: ["COMPLETADA", "CANCELADA"] } }),
    },
    include: {
      vehicle: true,
      collaborator: { select: STAFF_SELECT },
      client: { select: CLIENT_SELECT },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

/**
 * Para que un cliente consulte su propia agenda por WhatsApp — n8n ya
 * verificó el rol vía GET /api/n8n/usuarios antes de llamar esto. Solo
 * citas futuras y no canceladas, para no mostrarle historial viejo.
 */
export function listUpcomingAppointmentsByPhone(phone: string) {
  return prisma.appointment.findMany({
    where: { contactPhone: phone, status: { not: "CANCELADA" }, scheduledAt: { gte: new Date() } },
    include: { vehicle: true },
    orderBy: { scheduledAt: "asc" },
  })
}

export function getAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      vehicle: true,
      collaborator: { select: STAFF_SELECT },
      client: { select: CLIENT_SELECT },
      maintenance: { select: { id: true } },
    },
  })
}

const SLOT_DURATION_MINUTES = 60

/**
 * Dos citas (no canceladas) se consideran en conflicto si sus horas quedan
 * a menos de SLOT_DURATION_MINUTES de diferencia. No distingue por
 * colaborador: por defecto el taller solo atiende una cita a la vez en ese
 * horario, salvo que el staff decida forzarlo editando manualmente.
 */
export async function findSchedulingConflict(scheduledAt: Date, excludeId?: string) {
  const windowStart = new Date(scheduledAt.getTime() - SLOT_DURATION_MINUTES * 60 * 1000)
  const windowEnd = new Date(scheduledAt.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)

  return prisma.appointment.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: "CANCELADA" },
      scheduledAt: { gt: windowStart, lt: windowEnd },
    },
  })
}

function toData(input: AppointmentInput) {
  return {
    vehicleId: input.vehicleId || null,
    collaboratorId: input.collaboratorId || null,
    scheduledAt: new Date(input.scheduledAt),
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    notes: input.notes || null,
    status: input.status,
  }
}

export function createAppointment(input: AppointmentInput) {
  return prisma.appointment.create({ data: { ...toData(input), source: "WEB" } })
}

export function updateAppointment(id: string, input: AppointmentInput) {
  return prisma.appointment.update({ where: { id }, data: toData(input) })
}

export function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } })
}

/**
 * Corre una vez al día (cron, ver /api/cron/cleanup-appointments). Solo
 * cancela citas que quedaron en PENDIENTE (nunca fueron confirmadas) y ya
 * pasó su hora — una CONFIRMADA vencida se deja intacta, porque alguien sí
 * la confirmó y debe ser un colaborador quien decida si fue COMPLETADA o
 * no, nunca se cancela sola algo que ya se confirmó.
 */
export async function cancelStalePendingAppointments() {
  const result = await prisma.appointment.updateMany({
    where: { status: "PENDIENTE", scheduledAt: { lt: new Date() } },
    data: { status: "CANCELADA" },
  })
  return result.count
}

export class AppointmentNotFoundError extends Error {}

type N8nAppointmentUpdate = {
  scheduledAt?: Date
  status?: AppointmentInput["status"]
  notes?: string
  patente?: string
  contactName?: string
  contactPhone?: string
}

/**
 * Reagendar, cancelar o corregir datos de una cita por WhatsApp — a
 * diferencia del form web, acepta solo los campos que cambian (ej. el
 * cliente solo quiere mover la hora, no reescribir todo). Si viene
 * `patente` y el vehículo ya existe, la cita queda enlazada a ese vehículo
 * y a su dueño — mismo comportamiento que al crear la cita.
 */
export async function updateAppointmentForN8n(id: string, input: N8nAppointmentUpdate) {
  const existing = await prisma.appointment.findUnique({ where: { id } })
  if (!existing) throw new AppointmentNotFoundError("Cita no encontrada")

  // Si la patente no corresponde a ningún vehículo registrado, no tocamos el
  // vínculo existente (evita que un typo borre un vehículo ya bien enlazado).
  const vehicle = input.patente
    ? await prisma.vehicle.findUnique({ where: { patente: normalizePatente(input.patente) } })
    : null

  return prisma.appointment.update({
    where: { id },
    data: {
      scheduledAt: input.scheduledAt,
      status: input.status,
      notes: input.notes,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      ...(vehicle ? { vehicleId: vehicle.id, clientId: vehicle.clientId } : {}),
    },
  })
}
