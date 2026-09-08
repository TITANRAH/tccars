import { prisma } from "@/lib/prisma"
import type { AppointmentInput } from "@/features/appointments/schemas/appointment.schema"

const STAFF_SELECT = { id: true, firstName: true, lastName: true } as const
const CLIENT_SELECT = { id: true, firstName: true, lastName: true, email: true } as const

export function listAllAppointments() {
  return prisma.appointment.findMany({
    include: {
      vehicle: true,
      collaborator: { select: STAFF_SELECT },
      client: { select: CLIENT_SELECT },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

export function listAppointmentsForCollaborator(collaboratorId: string) {
  return prisma.appointment.findMany({
    where: { collaboratorId },
    include: {
      vehicle: true,
      collaborator: { select: STAFF_SELECT },
      client: { select: CLIENT_SELECT },
    },
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
