import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import {
  AppointmentForbiddenError,
  AppointmentInvalidTransitionError,
  AppointmentNotFoundError,
  findSchedulingConflict,
  updateAppointmentForN8n,
} from "@/features/appointments/services/appointment.service"
import { isWithinBusinessHours } from "@/features/business-hours/services/business-hours.service"
import { normalizePhone } from "@/lib/phone"
import { formatAppointmentLabelForBot } from "@/lib/format"

// $fromAI() en n8n manda "" (no omite la clave) cuando la IA no tiene un
// valor para un parámetro opcional — sin esto, "" rompería el enum de
// status y cualquier otro campo opcional se guardaría vacío en vez de
// dejarse tal cual estaba.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val)

const bodySchema = z.object({
  scheduledAt: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"]).optional()
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  patente: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  contactName: z.preprocess(emptyToUndefined, z.string().trim().min(2).optional()),
  contactPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(6)
      .optional()
      .transform((v) => (v ? normalizePhone(v) : v))
  ),
  // Fijos en el JSON de cada herramienta de n8n, tomados de `Resolver rol` —
  // nunca los decide la IA. `collaboratorId` solo se manda cuando `role` es
  // "COLLABORATOR" (para un ADMIN se deja vacío a propósito, ver más abajo).
  role: z.enum(["ADMIN", "COLLABORATOR", "CLIENT"]).optional(),
  collaboratorId: z.string().trim().optional(),
})

/**
 * Reagendar, cancelar o corregir datos de una cita ya creada. Tanto
 * ADMIN/COLLABORATOR como el propio CLIENT pueden llamar esto (n8n ya
 * verificó rol y, si es CLIENT, que la cita sea suya vía GET
 * /api/n8n/appointments?phone=... antes de tener el ID) — el endpoint en sí
 * no distingue rol para el caso CLIENT, así que esa restricción de "solo tu
 * propia cita" vive en el prompt/herramientas de n8n, no acá.
 *
 * Para COLLABORATOR sí se aplica acá: puede VER todas las citas del taller
 * (`GET /api/n8n/appointments?from=...`), pero solo puede EDITAR las que
 * están sin asignar o asignadas a él mismo — si `role: "COLLABORATOR"` y la
 * cita ya tiene otro `collaboratorId`, se rechaza con 403. Un ADMIN sigue
 * pudiendo editar cualquier cita (por eso su herramienta nunca manda
 * `collaboratorId`).
 *
 * Manda solo los campos que cambian. Si viene `patente` y el vehículo ya
 * existe, la cita queda enlazada a ese vehículo (igual que al crearla).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  if (parsed.data.scheduledAt) {
    const date = new Date(parsed.data.scheduledAt)

    if (!(await isWithinBusinessHours(date))) {
      return NextResponse.json(
        { ok: false, available: false, error: "Esa hora está fuera del horario de atención." },
        { status: 409 }
      )
    }

    const conflict = await findSchedulingConflict(date, id)
    if (conflict) {
      return NextResponse.json(
        { ok: false, available: false, error: "Esa hora ya está reservada. Ofrece otro horario." },
        { status: 409 }
      )
    }
  }

  try {
    const appointment = await updateAppointmentForN8n(id, {
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      status: parsed.data.status,
      notes: parsed.data.notes,
      patente: parsed.data.patente,
      contactName: parsed.data.contactName,
      contactPhone: parsed.data.contactPhone,
      requesterCollaboratorId:
        parsed.data.role === "COLLABORATOR" ? parsed.data.collaboratorId : undefined,
    })
    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
      scheduledAtLabel: formatAppointmentLabelForBot(appointment.scheduledAt),
    })
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof AppointmentForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppointmentInvalidTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    throw error
  }
}
