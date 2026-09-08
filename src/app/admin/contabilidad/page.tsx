import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  getAccountingSummary,
  listMaintenancesForAccounting,
} from "@/features/accounting/services/accounting.service"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCLP, formatDate } from "@/lib/format"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Contabilidad — Panel admin" }

const PAYMENT_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADO: "Pagado",
}

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; collaboratorId?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { from = "", to = "", collaboratorId = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const filters = { from, to, collaboratorId }
  const [summary, maintenancePage, staff] = await Promise.all([
    getAccountingSummary(filters),
    listMaintenancesForAccounting(filters, page),
    listStaffUsers(),
  ])
  const { items: maintenances, total, totalPages } = maintenancePage

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (collaboratorId) params.set("collaboratorId", collaboratorId)
    params.set("page", String(targetPage))
    return `/admin/contabilidad?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Contabilidad</h1>

      <form className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Colaborador</label>
          <select
            name="collaboratorId"
            defaultValue={collaboratorId}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {fullName(s)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Filtrar</Button>
        {from || to || collaboratorId ? (
          <Button asChild variant="outline">
            <Link href="/admin/contabilidad">Limpiar</Link>
          </Button>
        ) : null}
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ingresos totales</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatCLP(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mano de obra</p>
          <p className="mt-1 text-xl font-bold">{formatCLP(summary.totalLabor)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Repuestos</p>
          <p className="mt-1 text-xl font-bold">{formatCLP(summary.totalParts)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mantenciones</p>
          <p className="mt-1 text-xl font-bold">{summary.count}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">Por colaborador</h2>
          {summary.byCollaborator.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <div className="space-y-2">
              {summary.byCollaborator.map((row) => (
                <div
                  key={row.collaboratorId ?? "sin-asignar"}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <span>{row.collaborator ? fullName(row.collaborator) : "Sin asignar"}</span>
                  <span className="font-medium">
                    {formatCLP(row.total)} <span className="text-muted-foreground">({row.count})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">Por estado de pago</h2>
          {summary.byPaymentStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <div className="space-y-2">
              {summary.byPaymentStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <span>{PAYMENT_LABELS[row.status] ?? row.status}</span>
                  <span className="font-medium">
                    {formatCLP(row.total)} <span className="text-muted-foreground">({row.count})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Detalle</h2>
        <p className="text-xs text-muted-foreground">{total} mantención(es) en total</p>
      </div>
      {maintenances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay mantenciones en este rango.</p>
      ) : (
        <div className="space-y-2">
          {maintenances.map((m) => (
            <Link
              key={m.id}
              href={`/colaborador/mantenciones/${m.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/50"
            >
              <div>
                <p className="font-medium text-foreground">
                  {m.vehicle.patente} · {m.vehicle.marca} {m.vehicle.modelo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(m.createdAt)}
                  {m.collaborator ? ` · ${fullName(m.collaborator)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.paymentStatus === "PAGADO" ? "default" : "secondary"}>
                  {PAYMENT_LABELS[m.paymentStatus]}
                </Badge>
                <span className="font-bold">{formatCLP(m.totalCost)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>Anterior</Link>
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>Siguiente</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
