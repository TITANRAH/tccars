import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { addQuoteResponse, findSupplierByEmail } from "@/features/quotes/services/quote.service"

const bodySchema = z
  .object({
    supplierId: z.string().trim().optional(),
    supplierEmail: z.string().trim().email().optional(),
    amount: z.coerce.number().min(0),
    notes: z.string().trim().optional(),
  })
  .refine((data) => !!data.supplierId || !!data.supplierEmail, {
    message: "Debes enviar supplierId o supplierEmail",
  })

/**
 * n8n llama esto por cada respuesta de cotización que le llega de un
 * proveedor (por correo), para dejar registro. Acepta supplierEmail para no
 * obligar a n8n a conocer el id interno del proveedor.
 */
export async function POST(
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

  let supplierId = parsed.data.supplierId
  if (!supplierId && parsed.data.supplierEmail) {
    const supplier = await findSupplierByEmail(parsed.data.supplierEmail)
    if (!supplier) {
      return NextResponse.json({ error: "No se encontró un proveedor con ese correo" }, { status: 404 })
    }
    supplierId = supplier.id
  }

  const response = await addQuoteResponse({
    quoteRequestId: id,
    supplierId: supplierId!,
    amount: parsed.data.amount,
    notes: parsed.data.notes,
  })

  return NextResponse.json({ ok: true, quoteResponseId: response.id })
}
