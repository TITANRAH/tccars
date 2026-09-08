import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidN8nRequest } from "@/lib/n8n-auth"
import { selectQuoteResponse } from "@/features/quotes/services/quote.service"

const bodySchema = z.object({
  quoteResponseId: z.string().trim().min(1),
})

/**
 * n8n llama esto después de analizar todas las respuestas y decidir cuál
 * cotización es la más conveniente, justo antes de enviársela al cliente
 * por WhatsApp/correo. Solo dejamos el registro de cuál quedó seleccionada.
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

  await selectQuoteResponse(id, parsed.data.quoteResponseId)
  return NextResponse.json({ ok: true })
}
