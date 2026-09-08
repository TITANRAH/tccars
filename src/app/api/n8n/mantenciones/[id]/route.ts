import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import {
  findStaffByPhone,
  updateMaintenanceForN8n,
} from "@/features/maintenances/services/maintenance.service"

const bodySchema = z.object({
  description: z.string().trim().optional(),
  type: z.enum(["MANTENCION", "VISITA_TECNICA"]).optional(),
  status: z.enum(["AGENDADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).optional(),
  paymentStatus: z.enum(["PENDIENTE", "PAGADO", "PARCIAL"]).optional(),
  collaboratorId: z.string().trim().optional(),
  collaboratorPhone: z.string().trim().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  nextServiceMileage: z.coerce.number().int().min(0).optional(),
  laborCost: z.coerce.number().min(0).optional(),
  partsCost: z.coerce.number().min(0).optional(),
  additionalCost: z.coerce.number().min(0).optional(),
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
