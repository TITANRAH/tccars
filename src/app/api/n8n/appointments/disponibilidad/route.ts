import { NextRequest, NextResponse } from "next/server"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { findSchedulingConflict } from "@/features/appointments/services/appointment.service"
import { describeBusinessHours } from "@/features/business-hours/services/business-hours.service"

/**
 * Consulta rápida para que el agente de WhatsApp pregunte "¿está libre esta
 * hora?" antes de ofrecérsela al cliente, en vez de enterarse recién al
 * intentar crear la cita. Ej: GET /api/n8n/appointments/disponibilidad?scheduledAt=2026-09-15T10:30:00
 */
export async function GET(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const scheduledAt = request.nextUrl.searchParams.get("scheduledAt")
  if (!scheduledAt) {
    return NextResponse.json({ error: "Falta scheduledAt" }, { status: 400 })
  }

  const date = new Date(scheduledAt)
  // El día de la semana lo calculamos acá y se lo devolvemos tal cual al bot
  // — dejarle esa cuenta a la IA le hizo confundir "sábado 12" con "viernes
  // 12" en una prueba real (2026-09-09), aunque la cita quedó bien guardada
  // en la fecha correcta. Así el bot solo repite el dato, no lo calcula.
  // timeZone "UTC" (no "America/Santiago") a propósito — mismo motivo que
  // `formatAppointmentLabelForBot` en src/lib/format.ts: `scheduledAt` llega
  // sin offset y el servidor (UTC) lo guarda literal, así que esos dígitos
  // YA representan la hora de Chile tal como se escribió — convertir nombre
  // real de Santiago sería una segunda conversión que corre la hora (y a
  // veces el día) sin necesidad.
  const dayOfWeek = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date)

  const hoursCheck = await describeBusinessHours(date)
  if (!hoursCheck.available) {
    return NextResponse.json({
      available: false,
      reason: "fuera_de_horario",
      reasonDetail: hoursCheck.reason,
      dayOfWeek,
    })
  }

  const conflict = await findSchedulingConflict(date)
  return NextResponse.json({
    available: !conflict,
    reason: conflict ? "hora_ocupada" : undefined,
    dayOfWeek,
  })
}
