import { NextRequest, NextResponse } from "next/server"
import { cancelStalePendingAppointments } from "@/features/appointments/services/appointment.service"

/**
 * Vercel Cron llama esto una vez al día (ver vercel.json). Cancela citas
 * que quedaron en PENDIENTE (nadie las confirmó) y ya pasó su hora —
 * libera el horario para que se pueda volver a agendar. Autenticado con
 * `CRON_SECRET`, que Vercel manda solo (nadie más conoce ese valor).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const cancelled = await cancelStalePendingAppointments()
  return NextResponse.json({ ok: true, cancelled })
}
