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

// Para los enum (type/status/paymentStatus): pese a la instrucción de "dejar
// vacío si no aplica", se detectó en vivo (2026-09-14) que la IA igual
// rellenaba `type` con un valor que no calzaba exactamente con el enum (el
// colaborador nunca mencionó el tipo) — el "" de arriba no lo cubre porque
// no llegó vacío, llegó con texto inválido. En vez de rechazar todo el PATCH
// por un campo secundario, cualquier valor que no sea una opción válida se
// trata igual que si no hubiera venido.
const invalidEnumToUndefined =
  (allowed: readonly string[]) => (val: unknown) =>
    typeof val === "string" && val !== "" && !allowed.includes(val) ? undefined : val

const MAINTENANCE_TYPES = ["MANTENCION", "VISITA_TECNICA"] as const
const MAINTENANCE_STATUSES = ["AGENDADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"] as const
const PAYMENT_STATUSES = ["PENDIENTE", "PAGADO", "PARCIAL"] as const

const bodySchema = z.object({
  description: z.preprocess(emptyToUndefined, z.string().trim().optional()),
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
