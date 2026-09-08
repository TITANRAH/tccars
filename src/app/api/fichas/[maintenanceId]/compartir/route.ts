import { NextRequest, NextResponse } from "next/server"
import { getMaintenance } from "@/features/maintenances/services/maintenance.service"
import { resolveFichaFile } from "@/features/maintenances/services/ficha.service"

/**
 * Link público para compartir la ficha por WhatsApp — sin login, protegido
 * solo por el token (32 bytes al azar, ver ensureShareToken). Igual que
 * compartir un archivo de Drive "cualquiera con el link, sin iniciar sesión".
 * GET /api/fichas/:maintenanceId/compartir?token=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ maintenanceId: string }> }
) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Falta token" }, { status: 400 })
  }

  const { maintenanceId } = await params
  const maintenance = await getMaintenance(maintenanceId)
  if (!maintenance || maintenance.shareToken !== token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const result = await resolveFichaFile(maintenance)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return new NextResponse(new Uint8Array(result.file.buffer), {
    headers: {
      "Content-Type": result.file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(result.file.filename)}"`,
    },
  })
}
