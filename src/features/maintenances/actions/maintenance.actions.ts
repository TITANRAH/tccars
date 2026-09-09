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
  ensureShareToken,
  getMaintenance,
  MaintenanceImageLimitError,
  updateMaintenance,
  type MaintenanceWithRelations,
} from "@/features/maintenances/services/maintenance.service"
import { resolveFichaFile } from "@/features/maintenances/services/ficha.service"
import { backupImageToDrive, deleteFileFromDrive } from "@/lib/google-drive-backup"
import { deleteUploadThingFile } from "@/lib/uploadthing-server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email/resend"
import { FichaEmail } from "@/lib/email/templates/ficha-email"
import { fullName } from "@/lib/user-display"

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

/**
 * Respalda una foto en la misma carpeta de Drive que la ficha de esa
 * mantención, en segundo plano — descarga el archivo desde UploadThing (la
 * fuente real que sirve la galería) y sube una copia. Cada foto se sube una
 * sola vez, nunca se sobrescribe (a diferencia de la ficha, una foto no
 * cambia después de subida).
 */
function scheduleImageBackup(maintenance: MaintenanceWithRelations, imageId: string, url: string) {
  void fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`No se pudo descargar la foto (${res.status})`)
      const mimeType = res.headers.get("content-type") ?? "image/jpeg"
      const extension = mimeType.split("/")[1]?.split("+")[0] ?? "jpg"
      const buffer = Buffer.from(await res.arrayBuffer())
      return backupImageToDrive({
        patente: maintenance.vehicle.patente,
        date: maintenance.scheduledAt ?? maintenance.completedAt ?? maintenance.createdAt,
        tipo: maintenance.type,
        filename: `foto-${imageId}.${extension}`,
        mimeType,
        buffer,
      })
    })
    .then((driveFileId) => prisma.maintenanceImage.update({ where: { id: imageId }, data: { driveFileId } }))
    .catch((error) => {
      console.error("[mantenciones] No se pudo respaldar la foto en Drive:", error)
    })
}

export async function addMaintenanceImageAction(
  maintenanceId: string,
  url: string
): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  let image
  try {
    image = await addMaintenanceImage(maintenanceId, url)
  } catch (error) {
    if (error instanceof MaintenanceImageLimitError) {
      return { success: false, error: error.message }
    }
    throw error
  }

  const maintenance = await getMaintenance(maintenanceId)
  if (maintenance) {
    scheduleImageBackup(maintenance, image.id, url)
  }

  revalidatePath(`/colaborador/mantenciones/${maintenanceId}`)
  return { success: true }
}

export async function deleteMaintenanceImageAction(id: string, maintenanceId: string) {
  await requireRole("ADMIN", "COLLABORATOR")
  const deleted = await deleteMaintenanceImage(id)

  void deleteUploadThingFile(deleted.url).catch((error) => {
    console.error("[mantenciones] No se pudo borrar la foto de UploadThing:", error)
  })
  if (deleted.driveFileId) {
    void deleteFileFromDrive(deleted.driveFileId).catch((error) => {
      console.error("[mantenciones] No se pudo borrar la foto respaldada en Drive:", error)
    })
  }

  revalidatePath(`/colaborador/mantenciones/${maintenanceId}`)
}

export async function sendFichaByEmailAction(maintenanceId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")

  const maintenance = await getMaintenance(maintenanceId)
  if (!maintenance) {
    return { success: false, error: "Mantención no encontrada" }
  }

  const result = await resolveFichaFile(maintenance)
  if (!result.ok) {
    return { success: false, error: result.error }
  }

  try {
    await sendEmail({
      to: maintenance.vehicle.client.email,
      subject: "Tu ficha de mantención — TC Cars",
      react: FichaEmail({
        clientName: fullName(maintenance.vehicle.client),
        vehicleLabel: `${maintenance.vehicle.marca} ${maintenance.vehicle.modelo} ${maintenance.vehicle.patente}`,
      }),
      attachments: [{ filename: result.file.filename, content: result.file.buffer }],
    })
  } catch {
    return { success: false, error: "No se pudo enviar el correo. Intenta de nuevo más tarde." }
  }

  return { success: true }
}

/** Genera (si hace falta) el link público de la ficha, para compartir por WhatsApp. */
export async function getFichaShareLinkAction(
  maintenanceId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  await requireRole("ADMIN", "COLLABORATOR")

  const token = await ensureShareToken(maintenanceId)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return { success: true, url: `${baseUrl}/api/fichas/${maintenanceId}/compartir?token=${token}` }
}
