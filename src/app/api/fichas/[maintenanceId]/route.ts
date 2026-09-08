import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getMaintenance,
  type MaintenanceWithRelations,
} from "@/features/maintenances/services/maintenance.service"
import { downloadDriveFile } from "@/lib/google-drive"
import { renderFichaPdf } from "@/lib/pdf/render-ficha"
import { fullName } from "@/lib/user-display"

async function generateOwnFicha(maintenance: MaintenanceWithRelations) {
  // Solo generamos el PDF propio cuando la mantención ya está completada (si
  // no, saldría con costos/descripción vacíos).
  if (maintenance.status !== "COMPLETADA") {
    return NextResponse.json(
      { error: "La ficha estará disponible cuando la mantención esté completada" },
      { status: 409 }
    )
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ficha-${maintenance.vehicle.patente}-${maintenance.folio}.pdf"`,
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ maintenanceId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { maintenanceId } = await params
  const maintenance = await getMaintenance(maintenanceId)
  if (!maintenance) {
    return NextResponse.json({ error: "Mantención no encontrada" }, { status: 404 })
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "COLLABORATOR"
  const isOwner = maintenance.vehicle.clientId === session.user.id
  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  // Si n8n ya generó y enlazó una ficha en Drive, esa es la fuente de verdad.
  if (maintenance.fichaDriveFileId) {
    try {
      const file = await downloadDriveFile(maintenance.fichaDriveFileId)
      return new NextResponse(new Uint8Array(file.buffer), {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        },
      })
    } catch {
      // No dejamos al cliente sin ficha solo porque Drive no esté configurado,
      // esté caído, o el archivo ya no exista/no esté compartido: generamos
      // el PDF propio con los mismos datos como respaldo.
      return generateOwnFicha(maintenance)
    }
  }

  return generateOwnFicha(maintenance)
}
