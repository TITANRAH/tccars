import { NextRequest, NextResponse } from "next/server"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { findSchedulingConflict } from "@/features/appointments/services/appointment.service"

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

  const conflict = await findSchedulingConflict(new Date(scheduledAt))
  return NextResponse.json({ available: !conflict })
}
