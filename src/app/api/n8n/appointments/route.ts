import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { prisma } from "@/lib/prisma"
import {
  findSchedulingConflict,
  listUpcomingAppointmentsByPhone,
} from "@/features/appointments/services/appointment.service"
import { isWithinBusinessHours } from "@/features/business-hours/services/business-hours.service"
import { normalizePatente } from "@/features/vehicles/schemas/vehicle.schema"
import { normalizePhone } from "@/lib/phone"

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
  contactPhone: z.string().trim().min(6).transform(normalizePhone),
  scheduledAt: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  // Fijo en el JSON de cada herramienta de n8n (nunca lo decide la IA) —
  // "CLIENT" es el autoservicio del cliente por WhatsApp, sujeto al tope de
  // citas activas; "STAFF" es un colaborador/admin agendando para alguien,
  // sin tope (igual que el formulario del sitio).
  actor: z.enum(["CLIENT", "STAFF"]).default("CLIENT"),
  // Igual que `actor`: viene fijo del id que ya devolvió /api/n8n/usuarios,
  // nunca lo decide la IA. Solo se usa cuando actor=STAFF y quien escribe es
  // COLLABORATOR (no ADMIN) — ver nota en el POST.
  collaboratorId: z.string().trim().optional(),
})

const MAX_ACTIVE_APPOINTMENTS_PER_PHONE = 5

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

  const { patente, contactName, contactPhone, scheduledAt, notes, actor, collaboratorId } = parsed.data
  const date = new Date(scheduledAt)

  if (actor === "CLIENT") {
    const activeCount = (await listUpcomingAppointmentsByPhone(contactPhone)).length
    if (activeCount >= MAX_ACTIVE_APPOINTMENTS_PER_PHONE) {
      return NextResponse.json(
        {
          ok: false,
          error: `Ya tienes ${activeCount} citas agendadas. Para agregar más, contacta directamente al taller.`,
        },
        { status: 409 }
      )
    }
  }

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
    ? await prisma.vehicle.findUnique({ where: { patente: normalizePatente(patente) } })
    : null

  const appointment = await prisma.appointment.create({
    data: {
      source: "WHATSAPP_N8N",
      status: "CONFIRMADA",
      vehicleId: vehicle?.id ?? null,
      clientId: vehicle?.clientId ?? null,
      // Un COLLABORATOR que agenda por WhatsApp probablemente va a atender él
      // mismo ese trabajo, así que le queda asignada directo — un ADMIN
      // agendando (rol de recepción, no mecánico) sigue quedando sin
      // asignar, igual que antes.
      collaboratorId: actor === "STAFF" ? collaboratorId || null : null,
      scheduledAt: date,
      contactName,
      contactPhone,
      notes: notes || null,
    },
  })

  return NextResponse.json({ ok: true, appointmentId: appointment.id })
}
