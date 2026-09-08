import { NextRequest, NextResponse } from "next/server"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { listActiveSuppliers } from "@/features/suppliers/services/supplier.service"

/**
 * Lista de proveedores activos para que n8n sepa a quién cotizar por correo.
 */
export async function GET(request: NextRequest) {
  if (!isValidN8nRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const suppliers = await listActiveSuppliers()
  return NextResponse.json({
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      specialty: s.specialty,
      phone: s.phone,
    })),
  })
}
