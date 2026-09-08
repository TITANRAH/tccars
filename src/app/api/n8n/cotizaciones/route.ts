import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { createQuoteRequest } from "@/features/quotes/services/quote.service"
import { getVehicleByPatente } from "@/features/vehicles/services/vehicle.service"
import type { Prisma } from "@/generated/prisma/client"

const bodySchema = z.object({
  patente: z.string().trim().optional(),
  maintenanceId: z.string().trim().optional(),
  requestedItems: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.unknown())]),
})

/**
 * n8n crea esta solicitud cuando el colaborador dice por voz todo lo que
 * necesita el auto. `requestedItems` queda tal cual se lo pasen (texto,
 * lista de repuestos, etc.) — la app solo lo guarda para trazabilidad.
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

  const vehicle = parsed.data.patente ? await getVehicleByPatente(parsed.data.patente.toUpperCase()) : null

  const quoteRequest = await createQuoteRequest({
    vehicleId: vehicle?.id ?? null,
    maintenanceId: parsed.data.maintenanceId ?? null,
    requestedItems: parsed.data.requestedItems as Prisma.InputJsonValue,
  })

  return NextResponse.json({ ok: true, quoteRequestId: quoteRequest.id })
}
