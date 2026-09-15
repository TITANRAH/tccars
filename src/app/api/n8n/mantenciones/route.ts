import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { getVehicleByPatente } from "@/features/vehicles/services/vehicle.service"
import { normalizePatente } from "@/features/vehicles/schemas/vehicle.schema"
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

  const vehicle = await getVehicleByPatente(normalizePatente(patente))
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

// $fromAI() en n8n manda "" (no omite la clave) cuando la IA no tiene un
// valor para un parámetro opcional — sin esto, "" rompería los enum y, peor
// aún en los campos numéricos, z.coerce.number() convierte "" en 0 en vez
// de fallar, lo que borraría silenciosamente un costo ya cargado en el PATCH.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val)

// Para los enum (type/status/paymentStatus): pese a la instrucción de "dejar
// vacío si no aplica", se detectó en vivo (2026-09-14) que la IA igual
// rellenaba `type` con un valor que no calzaba exactamente con el enum (el
// colaborador nunca mencionó el tipo) — el "" de arriba no lo cubre porque
// no llegó vacío, llegó con texto inválido. En vez de rechazar toda la
// mantención por un campo secundario con default razonable en la base
// (MANTENCION), cualquier valor que no sea una opción válida se trata igual
// que si no hubiera venido.
const invalidEnumToUndefined =
  (allowed: readonly string[]) => (val: unknown) =>
    typeof val === "string" && val !== "" && !allowed.includes(val) ? undefined : val

const MAINTENANCE_TYPES = ["MANTENCION", "VISITA_TECNICA"] as const
const MAINTENANCE_STATUSES = ["AGENDADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"] as const
const PAYMENT_STATUSES = ["PENDIENTE", "PAGADO", "PARCIAL"] as const

const bodySchema = z.object({
  patente: z.string().trim().min(1),
  description: z.string().trim().min(1),
  type: z.preprocess(
    invalidEnumToUndefined(MAINTENANCE_TYPES),
    z.preprocess(emptyToUndefined, z.enum(MAINTENANCE_TYPES).optional())
  ),
  status: z.preprocess(
    invalidEnumToUndefined(MAINTENANCE_STATUSES),
    z.preprocess(emptyToUndefined, z.enum(MAINTENANCE_STATUSES).optional())
  ),
  paymentStatus: z.preprocess(
    invalidEnumToUndefined(PAYMENT_STATUSES),
    z.preprocess(emptyToUndefined, z.enum(PAYMENT_STATUSES).optional())
  ),
  collaboratorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  collaboratorPhone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  mileage: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  nextServiceMileage: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  laborCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  partsCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  additionalCost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
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

  const vehicle = await getVehicleByPatente(normalizePatente(parsed.data.patente))
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
