"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import {
  maintenanceSchema,
  type MaintenanceInput,
} from "@/features/maintenances/schemas/maintenance.schema"
import {
  addMaintenanceImage,
  createMaintenance,
  deleteMaintenance,
  deleteMaintenanceImage,
  MaintenanceImageLimitError,
  updateMaintenance,
} from "@/features/maintenances/services/maintenance.service"

type ActionResult = { success: true } | { success: false; error: string }

export async function createMaintenanceAction(input: MaintenanceInput): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = maintenanceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const maintenance = await createMaintenance(parsed.data)
  revalidatePath(`/colaborador/vehiculos/${parsed.data.vehicleId}`)
  redirect(`/colaborador/mantenciones/${maintenance.id}`)
}

export async function updateMaintenanceAction(
  id: string,
  input: MaintenanceInput
): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = maintenanceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await updateMaintenance(id, parsed.data)
  revalidatePath(`/colaborador/vehiculos/${parsed.data.vehicleId}`)
  revalidatePath(`/colaborador/mantenciones/${id}`)
  return { success: true }
}

export async function deleteMaintenanceAction(id: string, vehicleId: string) {
  await requireRole("ADMIN")
  await deleteMaintenance(id)
  revalidatePath(`/colaborador/vehiculos/${vehicleId}`)
  redirect(`/colaborador/vehiculos/${vehicleId}`)
}

export async function addMaintenanceImageAction(
  maintenanceId: string,
  url: string
): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  try {
    await addMaintenanceImage(maintenanceId, url)
  } catch (error) {
    if (error instanceof MaintenanceImageLimitError) {
      return { success: false, error: error.message }
    }
    throw error
  }
  revalidatePath(`/colaborador/mantenciones/${maintenanceId}`)
  return { success: true }
}

export async function deleteMaintenanceImageAction(id: string, maintenanceId: string) {
  await requireRole("ADMIN", "COLLABORATOR")
  await deleteMaintenanceImage(id)
  revalidatePath(`/colaborador/mantenciones/${maintenanceId}`)
}
