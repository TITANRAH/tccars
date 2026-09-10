import { prisma } from "@/lib/prisma"
import type { AppointmentInput } from "@/features/appointments/schemas/appointment.schema"
import { normalizePatente } from "@/features/vehicles/schemas/vehicle.schema"
import { Prisma, type AppointmentStatus } from "@/generated/prisma/client"

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

/**
 * Para mostrar en `/mi-cuenta` la(s) cita(s) próxima(s) de un cliente con
 * cuenta en el sitio. Busca por `clientId` (citas creadas desde el sitio, o
 * por WhatsApp cuando la patente coincidió con un vehículo suyo) y también
 * por su teléfono (citas por WhatsApp sin patente, que solo quedan con
 * `contactPhone`) — sin esto, a un cliente que agendó por WhatsApp sin decir
 * la patente no le aparecería nada aunque la cita exista.
 */
export function listUpcomingAppointmentsForClient(clientId: string, phone: string | null) {
  return prisma.appointment.findMany({
    where: {
      status: { not: "CANCELADA" },
      scheduledAt: { gte: new Date() },
      OR: phone ? [{ clientId }, { contactPhone: phone }] : [{ clientId }],
    },
    include: { vehicle: true },
    orderBy: { scheduledAt: "asc" },
  })
}

// Tope de resultados al consultar citas por rango de fecha desde WhatsApp —
// evita que el bot mande un mensaje gigante si el taller tiene muchas citas
// esa semana. Si hay más, `total` avisa cuántas quedaron fuera para que el
// bot pueda sugerir acortar el rango (ej. pedir el día en vez de la semana).
const N8N_APPOINTMENTS_LIST_LIMIT = 15

/**
 * Para que un colaborador/admin pida por WhatsApp "las citas del día/semana"
 * (o "las citas pendientes") en vez de tener que abrir el sitio — solo
 * lectura, sin filtrar por teléfono de contacto (a diferencia de
 * `listUpcomingAppointmentsByPhone`, que es para que un CLIENT vea las
 * suyas). `to` es opcional (un rango abierto hacia adelante, ej. "todas mis
 * pendientes" sin importar hasta cuándo — el tope de resultados igual
 * evita que la respuesta sea gigante). `collaboratorId` opcional acota a
 * "mis citas". `status` opcional filtra a un solo estado (ej. solo
 * PENDIENTE para ver qué falta confirmar, o CANCELADA para revisar
 * cancelaciones); si no viene, incluye solo PENDIENTE y CONFIRMADA (el
 * caso normal de "qué tengo agendado", sin canceladas ni ya completadas).
 */
export async function listAppointmentsInRangeForN8n(
  from: Date,
  to?: Date,
  collaboratorId?: string,
  status?: AppointmentStatus
) {
  const where: Prisma.AppointmentWhereInput = {
    scheduledAt: { gte: from, ...(to ? { lte: to } : {}) },
    status: status ?? { in: ["PENDIENTE", "CONFIRMADA"] },
    ...(collaboratorId ? { collaboratorId } : {}),
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { vehicle: true, collaborator: { select: STAFF_SELECT } },
      orderBy: { scheduledAt: "asc" },
      take: N8N_APPOINTMENTS_LIST_LIMIT,
    }),
    prisma.appointment.count({ where }),
  ])

  return { appointments, total }
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
 * Dos citas se consideran en conflicto si sus horas quedan a menos de
 * SLOT_DURATION_MINUTES de diferencia. Solo PENDIENTE/CONFIRMADA cuentan —
 * una CANCELADA nunca ocupó el horario, y una COMPLETADA ya terminó (el auto
 * se fue), así que tampoco debería seguir bloqueando ese horario para
 * siempre. No distingue por colaborador: por defecto el taller solo atiende
 * una cita a la vez en ese horario, salvo que el staff decida forzarlo
 * editando manualmente.
 */
export async function findSchedulingConflict(scheduledAt: Date, excludeId?: string) {
  const windowStart = new Date(scheduledAt.getTime() - SLOT_DURATION_MINUTES * 60 * 1000)
  const windowEnd = new Date(scheduledAt.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)

  return prisma.appointment.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ["PENDIENTE", "CONFIRMADA"] },
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
export class AppointmentForbiddenError extends Error {}

type N8nAppointmentUpdate = {
  scheduledAt?: Date
  status?: AppointmentInput["status"]
  notes?: string
  patente?: string
  contactName?: string
  contactPhone?: string
  // Solo viene cuando quien pide el cambio es un COLLABORATOR (nunca un
  // ADMIN) — exige que la cita sea suya o esté sin asignar. Un COLLABORATOR
  // puede VER todas las citas del taller, pero solo editar las propias; un
  // ADMIN sigue pudiendo editar cualquiera (por eso este campo va vacío
  // cuando quien pide el cambio es ADMIN).
  requesterCollaboratorId?: string
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

  if (
    input.requesterCollaboratorId &&
    existing.collaboratorId &&
    existing.collaboratorId !== input.requesterCollaboratorId
  ) {
    throw new AppointmentForbiddenError("Esta cita está asignada a otro colaborador.")
  }

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
