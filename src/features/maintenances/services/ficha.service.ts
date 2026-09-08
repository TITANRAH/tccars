import type { MaintenanceWithRelations } from "@/features/maintenances/services/maintenance.service"
import { downloadDriveFile } from "@/lib/google-drive"
import { renderFichaPdf } from "@/lib/pdf/render-ficha"
import { fullName } from "@/lib/user-display"

export type FichaFile = { buffer: Buffer; mimeType: string; filename: string }
export type FichaResult = { ok: true; file: FichaFile } | { ok: false; status: number; error: string }

async function generateOwnFicha(maintenance: MaintenanceWithRelations): Promise<FichaResult> {
  // Solo generamos el PDF propio cuando la mantención ya está completada (si
  // no, saldría con costos/descripción vacíos).
  if (maintenance.status !== "COMPLETADA") {
    return {
      ok: false,
      status: 409,
      error: "La ficha estará disponible cuando la mantención esté completada",
    }
  }

  const buffer = await renderFichaPdf({
    folio: maintenance.folio,
    // completedAt/startedAt nunca se setean en el flujo actual (ni web ni
    // n8n) — scheduledAt es el único campo de fecha que el colaborador
    // realmente controla, y el que refleja cuándo fue el servicio de verdad.
    date: maintenance.scheduledAt ?? maintenance.completedAt ?? maintenance.createdAt,
    clientName: fullName(maintenance.vehicle.client),
    vehicleLabel: `${maintenance.vehicle.marca} ${maintenance.vehicle.modelo} ${maintenance.vehicle.patente}`,
    clientPhone: maintenance.vehicle.client.phone ?? null,
    description: maintenance.description,
    mileage: maintenance.mileage,
    nextServiceMileage: maintenance.nextServiceMileage,
    laborCost: Number(maintenance.laborCost),
    partsCost: Number(maintenance.partsCost),
    additionalCost: Number(maintenance.additionalCost),
  })

  return {
    ok: true,
    file: {
      buffer,
      mimeType: "application/pdf",
      filename: `ficha-${maintenance.vehicle.patente}-${maintenance.folio}.pdf`,
    },
  }
}

/**
 * Misma lógica que usa el botón "Descargar ficha": si n8n ya enlazó un
 * archivo real de Drive, esa es la fuente de verdad; si no, o si Drive
 * falla por lo que sea, se genera el PDF propio. Compartida entre la ruta
 * de descarga autenticada, el link público para compartir, y el envío por
 * correo — para que las tres siempre entreguen exactamente el mismo archivo.
 */
export async function resolveFichaFile(maintenance: MaintenanceWithRelations): Promise<FichaResult> {
  if (maintenance.fichaDriveFileId) {
    try {
      const file = await downloadDriveFile(maintenance.fichaDriveFileId)
      return { ok: true, file: { buffer: file.buffer, mimeType: file.mimeType, filename: file.name } }
    } catch {
      // No dejamos a nadie sin ficha solo porque Drive no esté configurado,
      // esté caído, o el archivo ya no exista/no esté compartido.
      return generateOwnFicha(maintenance)
    }
  }

  return generateOwnFicha(maintenance)
}
