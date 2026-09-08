import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { prisma } from "@/lib/prisma"
import {
  findSchedulingConflict,
  listUpcomingAppointmentsByPhone,
} from "@/features/appointments/services/appointment.service"
import { isWithinBusinessHours } from "@/features/business-hours/services/business-hours.service"

/**
 * Para que un cliente consulte su propia agenda por WhatsApp (rol CLIENT,
 * ya verificado vía GET /api/n8n/usuarios) — solo lectura, nunca crea ni
 * modifica nada. GET /api/n8n/appointments?phone=+56912345678
 */
export async function GET(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const phone = request.nextUrl.searchParams.get("phone")
  if (!phone) {
    return NextResponse.json({ error: "Falta phone" }, { status: 400 })
  }

  const appointments = await listUpcomingAppointmentsByPhone(phone)
  return NextResponse.json({
    appointments: appointments.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      status: a.status,
      vehicle: a.vehicle ? `${a.vehicle.marca} ${a.vehicle.modelo} ${a.vehicle.patente}` : null,
      notes: a.notes,
    })),
  })
}

const bodySchema = z.object({
  patente: z.string().trim().optional(),
  contactName: z.string().trim().min(2),
  contactPhone: z.string().trim().min(6),
  scheduledAt: z.string().trim().min(1),
  notes: z.string().trim().optional(),
})

/**
 * Endpoint que llama n8n cuando el agente de WhatsApp agenda una cita con
 * un cliente. Si viene `patente` y el auto ya existe en el sistema, la cita
 * queda enlazada a ese vehículo (y a su dueño); si no, queda solo con los
 * datos de contacto (cliente nuevo que aún no tiene cuenta ni auto
 * registrado). Protegido con el header `x-api-key`.
 */
export async function POST(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  const { patente, contactName, contactPhone, scheduledAt, notes } = parsed.data
  const date = new Date(scheduledAt)

  if (!(await isWithinBusinessHours(date))) {
    return NextResponse.json(
      { ok: false, available: false, error: "Esa hora está fuera del horario de atención." },
      { status: 409 }
    )
  }

  const conflict = await findSchedulingConflict(date)
  if (conflict) {
    return NextResponse.json(
      { ok: false, available: false, error: "Esa hora ya está reservada. Ofrece otro horario." },
      { status: 409 }
    )
  }

  const vehicle = patente
    ? await prisma.vehicle.findUnique({ where: { patente: patente.toUpperCase() } })
    : null

  const appointment = await prisma.appointment.create({
    data: {
      source: "WHATSAPP_N8N",
      status: "CONFIRMADA",
      vehicleId: vehicle?.id ?? null,
      clientId: vehicle?.clientId ?? null,
      scheduledAt: date,
      contactName,
      contactPhone,
      notes: notes || null,
    },
  })

  return NextResponse.json({ ok: true, appointmentId: appointment.id })
}
