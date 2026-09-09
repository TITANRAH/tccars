import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  getAccountingSummary,
  getMaintenanceStatusBreakdown,
  getMaintenanceTimeSeries,
  type StatsGranularity,
} from "@/features/accounting/services/accounting.service"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import {
  CollaboratorBarChart,
  StatusPieChart,
  TimeSeriesChart,
} from "@/features/accounting/components/stats-charts"
import { Button } from "@/components/ui/button"
import { formatCLP } from "@/lib/format"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Estadísticas — Panel admin" }

const GRANULARITY_LABELS: Record<StatsGranularity, string> = {
  day: "Por día",
  month: "Por mes",
  year: "Por año",
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    collaboratorId?: string
    granularity?: string
  }>
}) {
  await requireRole("ADMIN")
  const {
    from = "",
    to = "",
    collaboratorId = "",
    granularity: granularityParam = "month",
  } = await searchParams
  const granularity: StatsGranularity =
    granularityParam === "day" || granularityParam === "year" ? granularityParam : "month"

  const filters = { from, to, collaboratorId }
  const [summary, timeSeries, statusBreakdown, staff] = await Promise.all([
    getAccountingSummary(filters),
    getMaintenanceTimeSeries(filters, granularity),
    getMaintenanceStatusBreakdown(filters),
    listStaffUsers(),
  ])

  const collaboratorChartData = summary.byCollaborator.map((row) => ({
    name: row.collaborator ? fullName(row.collaborator) : "Sin asignar",
    total: row.total,
    count: row.count,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Estadísticas</h1>

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
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Agrupar</label>
          <select
            name="granularity"
            defaultValue={granularity}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(GRANULARITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Filtrar</Button>
        {from || to || collaboratorId || granularityParam !== "month" ? (
          <Button asChild variant="outline">
            <Link href="/admin/estadisticas">Limpiar</Link>
          </Button>
        ) : null}
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ingresos totales</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatCLP(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mantenciones</p>
          <p className="mt-1 text-xl font-bold">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mano de obra</p>
          <p className="mt-1 text-xl font-bold">{formatCLP(summary.totalLabor)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Repuestos</p>
          <p className="mt-1 text-xl font-bold">{formatCLP(summary.totalParts)}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold text-foreground">
          Mantenciones e ingresos — {GRANULARITY_LABELS[granularity].toLowerCase()}
        </h2>
        <TimeSeriesChart data={timeSeries} granularity={granularity} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">Ingresos por colaborador</h2>
          <CollaboratorBarChart data={collaboratorChartData} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">Mantenciones por estado</h2>
          <StatusPieChart data={statusBreakdown} />
        </div>
      </div>
    </div>
  )
}
