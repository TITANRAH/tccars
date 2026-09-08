import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { getVehicleByPatente } from "@/features/vehicles/services/vehicle.service"
import {
  createMaintenanceForN8n,
  findStaffByPhone,
  listOpenMaintenancesForN8n,
} from "@/features/maintenances/services/maintenance.service"

/**
 * Para que n8n resuelva por voz "cuál mantención" antes de cerrarla: el
 * colaborador dice la patente (y n8n ya sabe su teléfono desde WhatsApp),
 * y esto devuelve las mantenciones abiertas de ese auto para que n8n elija
 * sola si hay una sola, o le pregunte al colaborador cuál si hay varias.
 */
export async function GET(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const patente = searchParams.get("patente")?.trim()
  const collaboratorPhone = searchParams.get("collaboratorPhone")?.trim()
  if (!patente) {
    return NextResponse.json({ error: "Falta el parámetro patente" }, { status: 400 })
  }

  const vehicle = await getVehicleByPatente(patente.toUpperCase())
  if (!vehicle) {
    return NextResponse.json(
      { error: `No existe un vehículo registrado con la patente ${patente}` },
      { status: 404 }
    )
  }

  let collaboratorId: string | null = null
  if (collaboratorPhone) {
    const staff = await findStaffByPhone(collaboratorPhone)
    collaboratorId = staff?.id ?? null
  }

  const maintenances = await listOpenMaintenancesForN8n(vehicle.id, collaboratorId)

  return NextResponse.json({
    ok: true,
    maintenances: maintenances.map((m) => ({
      maintenanceId: m.id,
      folio: m.folio,
      description: m.description,
      status: m.status,
      createdAt: m.createdAt,
      collaboratorName: m.collaborator
        ? `${m.collaborator.firstName} ${m.collaborator.lastName}`
        : null,
    })),
  })
}

const bodySchema = z.object({
  patente: z.string().trim().min(1),
  description: z.string().trim().min(1),
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
 * n8n crea la mantención al momento de la visita (ej. cuando el colaborador
 * dice por voz todo lo que necesita el auto), para tener un `maintenanceId`
 * fijo que usar después tanto para las fotos como para enlazar la ficha
 * (`/api/n8n/fichas`) — así no hay que adivinar a qué mantención pertenece.
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

  const vehicle = await getVehicleByPatente(parsed.data.patente.toUpperCase())
  if (!vehicle) {
    return NextResponse.json(
      { error: `No existe un vehículo registrado con la patente ${parsed.data.patente}` },
      { status: 404 }
    )
  }

  let collaboratorId = parsed.data.collaboratorId ?? null
  if (!collaboratorId && parsed.data.collaboratorPhone) {
    const staff = await findStaffByPhone(parsed.data.collaboratorPhone)
    collaboratorId = staff?.id ?? null
  }

  const maintenance = await createMaintenanceForN8n(vehicle.id, {
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

  return NextResponse.json({ ok: true, maintenanceId: maintenance.id, folio: maintenance.folio })
}
