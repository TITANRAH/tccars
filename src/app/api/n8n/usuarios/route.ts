import { NextRequest, NextResponse } from "next/server"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { findUserRoleByPhone } from "@/features/n8n/services/n8n-access.service"

/**
 * Primer paso de cualquier flujo de WhatsApp: n8n consulta este endpoint
 * con el teléfono de quien escribió, para saber qué puede hacer.
 *
 * - role "ADMIN" o "COLLABORATOR" → puede crear/editar agendas, crear y
 *   cerrar mantenciones, pedir cotizaciones (los mismos endpoints que ya
 *   existen en N8N.md).
 * - role "CLIENT" → solo consultas: su propia agenda (GET
 *   /api/n8n/appointments?phone=...) o información general del taller.
 *   Nunca debe poder crear ni editar nada.
 * - found: false (número no registrado) → tratar como cliente anónimo,
 *   mismas restricciones que "CLIENT" pero sin datos personales que mostrar.
 *
 * GET /api/n8n/usuarios?phone=+56912345678
 */
export async function GET(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const phone = request.nextUrl.searchParams.get("phone")
  if (!phone) {
    return NextResponse.json({ error: "Falta phone" }, { status: 400 })
  }

  const user = await findUserRoleByPhone(phone)
  if (!user) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({
    found: true,
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  })
}
