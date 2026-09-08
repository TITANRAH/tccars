import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { linkFicha, MaintenanceNotFoundError } from "@/features/maintenances/services/maintenance.service"

const bodySchema = z
  .object({
    maintenanceId: z.string().trim().optional(),
    patente: z.string().trim().optional(),
    driveFileId: z.string().trim().min(1),
    driveUrl: z.string().trim().url().optional(),
  })
  .refine((data) => !!data.maintenanceId || !!data.patente, {
    message: "Debes enviar maintenanceId o patente",
  })

/**
 * Endpoint que llama n8n cuando termina de generar la "ficha" en Google
 * Drive, para dejar guardado el puntero (driveFileId) en la mantención
 * correspondiente. Protegido con el header `x-api-key`.
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

  try {
    const identifier = parsed.data.maintenanceId
      ? { maintenanceId: parsed.data.maintenanceId }
      : { patente: parsed.data.patente! }

    const maintenance = await linkFicha(identifier, parsed.data.driveFileId, parsed.data.driveUrl)
    return NextResponse.json({ ok: true, maintenanceId: maintenance.id })
  } catch (error) {
    if (error instanceof MaintenanceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: "No se pudo vincular la ficha" }, { status: 500 })
  }
}
