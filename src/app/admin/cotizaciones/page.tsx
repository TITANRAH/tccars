import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listQuoteRequests } from "@/features/quotes/services/quote.service"
import { Badge } from "@/components/ui/badge"
import { formatCLP, formatDateTime } from "@/lib/format"

export const metadata = { title: "Cotizaciones — Panel admin" }

const STATUS_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  RESPONDIDA: "Respondida",
  SELECCIONADA: "Seleccionada",
  CANCELADA: "Cancelada",
}

export default async function AdminQuotesPage() {
  await requireRole("ADMIN")
  const quoteRequests = await listQuoteRequests()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Cotizaciones</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        Historial de cotizaciones generadas por el agente de voz de WhatsApp.
      </p>

      {quoteRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay cotizaciones registradas.</p>
      ) : (
        <div className="space-y-4">
          {quoteRequests.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {q.vehicle ? `${q.vehicle.patente} · ${q.vehicle.marca} ${q.vehicle.modelo}` : "Sin vehículo"}
                </p>
                <Badge variant={q.status === "SELECCIONADA" ? "default" : "secondary"}>
                  {STATUS_LABELS[q.status] ?? q.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(q.createdAt)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {typeof q.requestedItems === "string"
                  ? q.requestedItems
                  : JSON.stringify(q.requestedItems)}
              </p>

              {q.responses.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {q.responses.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                    >
                      <span>
                        {r.supplier.name}
                        {r.selected ? (
                          <span className="ml-2 text-primary">✓ seleccionada</span>
                        ) : null}
                      </span>
                      <span className="font-medium">{formatCLP(r.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Sin respuestas todavía.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
