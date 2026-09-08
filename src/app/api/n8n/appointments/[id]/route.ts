import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import {
  AppointmentNotFoundError,
  findSchedulingConflict,
  updateAppointmentForN8n,
} from "@/features/appointments/services/appointment.service"
import { isWithinBusinessHours } from "@/features/business-hours/services/business-hours.service"

const bodySchema = z.object({
  scheduledAt: z.string().trim().min(1).optional(),
  status: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"]).optional(),
  notes: z.string().trim().optional(),
})

/**
 * Reagendar o cancelar una cita ya creada — solo ADMIN/COLLABORATOR pueden
 * pedir esto (n8n ya lo verificó vía GET /api/n8n/usuarios); un cliente
 * solo puede consultar su agenda, nunca modificarla directamente.
 *
 * Para reagendar, manda scheduledAt. Para cancelar, manda status: "CANCELADA".
 * Ambos se pueden mandar juntos si hace falta.
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
    })
    return NextResponse.json({ ok: true, appointmentId: appointment.id })
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    throw error
  }
}
