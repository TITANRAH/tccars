import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import {
  findStaffByPhone,
  updateMaintenanceForN8n,
} from "@/features/maintenances/services/maintenance.service"

// $fromAI() en n8n manda "" (no omite la clave) cuando la IA no tiene un
// valor para un parámetro opcional — sin esto, "" rompería los enum y, peor
// aún en los campos numéricos, z.coerce.number() convierte "" en 0 en vez
// de fallar, lo que borraría silenciosamente un costo ya cargado (el merge
// de updateMaintenanceForN8n solo preserva el valor anterior cuando el campo
// llega undefined, no cuando llega 0).
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val)

const bodySchema = z.object({
  description: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  type: z.preprocess(emptyToUndefined, z.enum(["MANTENCION", "VISITA_TECNICA"]).optional()),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["AGENDADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).optional()
  ),
  paymentStatus: z.preprocess(emptyToUndefined, z.enum(["PENDIENTE", "PAGADO", "PARCIAL"]).optional()),
  collaboratorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  collaboratorPhone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  mileage: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  nextServiceMileage: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  laborCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  partsCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  additionalCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
})

/**
 * Para completar datos que llegan después (ej. costos finales, kilometraje)
 * sobre una mantención que n8n ya había creado con POST /api/n8n/mantenciones.
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

  let collaboratorId = parsed.data.collaboratorId
  if (!collaboratorId && parsed.data.collaboratorPhone) {
    const staff = await findStaffByPhone(parsed.data.collaboratorPhone)
    collaboratorId = staff?.id
  }

  try {
    const maintenance = await updateMaintenanceForN8n(id, {
      description: parsed.data.description,
      type: parsed.data.type,
      status: parsed.data.status,
      paymentStatus: parsed.data.paymentStatus,
      collaboratorId,
      mileage: parsed.data.mileage,
      nextServiceMileage: parsed.data.nextServiceMileage,
      laborCost: parsed.data.laborCost,
      partsCost: parsed.data.partsCost,
      additionalCost: parsed.data.additionalCost,
    })
    return NextResponse.json({ ok: true, maintenanceId: maintenance.id })
  } catch {
    return NextResponse.json({ error: "Mantención no encontrada" }, { status: 404 })
  }
}
