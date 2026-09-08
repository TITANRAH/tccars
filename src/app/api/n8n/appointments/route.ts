import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { prisma } from "@/lib/prisma"
import { findSchedulingConflict } from "@/features/appointments/services/appointment.service"

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

  const conflict = await findSchedulingConflict(new Date(scheduledAt))
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
      scheduledAt: new Date(scheduledAt),
      contactName,
      contactPhone,
      notes: notes || null,
    },
  })

  return NextResponse.json({ ok: true, appointmentId: appointment.id })
}
