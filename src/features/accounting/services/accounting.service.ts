import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { AccountingFilterInput } from "@/features/accounting/schemas/accounting.schema"

export type StatsGranularity = "day" | "month" | "year"

const STAFF_SELECT = { id: true, firstName: true, lastName: true } as const

/**
 * El reporte se basa en `createdAt` (cuándo se registró la mantención en el
 * sistema), que es el dato más predecible y siempre presente. No filtramos
 * por `completedAt`/`scheduledAt` porque no todas las mantenciones los
 * tienen completos.
 */
function buildWhere(filters: AccountingFilterInput) {
  const where: Record<string, unknown> = {
    status: { not: "CANCELADA" },
  }

  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
    }
  }

  if (filters.collaboratorId) {
    where.collaboratorId = filters.collaboratorId
  }

  return where
}

const PAGE_SIZE = 20

export async function listMaintenancesForAccounting(filters: AccountingFilterInput, page = 1) {
  const where = buildWhere(filters)
  const [items, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: { vehicle: true, collaborator: { select: STAFF_SELECT } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.maintenance.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function getAccountingSummary(filters: AccountingFilterInput) {
  const where = buildWhere(filters)

  const [totals, byCollaborator, byPaymentStatus] = await Promise.all([
    prisma.maintenance.aggregate({
      where,
      _sum: { totalCost: true, laborCost: true, partsCost: true },
      _count: true,
    }),
    prisma.maintenance.groupBy({
      by: ["collaboratorId"],
      where,
      _sum: { totalCost: true },
      _count: true,
    }),
    prisma.maintenance.groupBy({
      by: ["paymentStatus"],
      where,
      _sum: { totalCost: true },
      _count: true,
    }),
  ])

  const collaboratorIds = byCollaborator
    .map((g) => g.collaboratorId)
    .filter((id): id is string => !!id)

  const collaborators = collaboratorIds.length
    ? await prisma.user.findMany({ where: { id: { in: collaboratorIds } }, select: STAFF_SELECT })
    : []

  return {
    totalRevenue: Number(totals._sum.totalCost ?? 0),
    totalLabor: Number(totals._sum.laborCost ?? 0),
    totalParts: Number(totals._sum.partsCost ?? 0),
    count: totals._count,
    byCollaborator: byCollaborator.map((g) => ({
      collaboratorId: g.collaboratorId,
      collaborator: collaborators.find((c) => c.id === g.collaboratorId) ?? null,
      total: Number(g._sum.totalCost ?? 0),
      count: g._count,
    })),
    byPaymentStatus: byPaymentStatus.map((g) => ({
      status: g.paymentStatus,
      total: Number(g._sum.totalCost ?? 0),
      count: g._count,
    })),
  }
}

/**
 * Serie de tiempo para los gráficos de `/admin/estadisticas` — cantidad de
 * mantenciones e ingresos agrupados por día/mes/año, usando `date_trunc` de
 * Postgres directamente (Prisma no tiene un `groupBy` por fecha truncada).
 * Reutiliza los mismos filtros (rango de fechas, colaborador) que Contabilidad.
 */
export async function getMaintenanceTimeSeries(
  filters: AccountingFilterInput,
  granularity: StatsGranularity
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`status != 'CANCELADA'`]
  if (filters.from) conditions.push(Prisma.sql`"createdAt" >= ${new Date(filters.from)}`)
  if (filters.to) conditions.push(Prisma.sql`"createdAt" <= ${new Date(`${filters.to}T23:59:59`)}`)
  if (filters.collaboratorId) conditions.push(Prisma.sql`"collaboratorId" = ${filters.collaboratorId}`)

  const rows = await prisma.$queryRaw<{ period: Date; count: number; revenue: number }[]>`
    SELECT date_trunc(${granularity}, "createdAt") AS period,
           COUNT(*)::int AS count,
           COALESCE(SUM("totalCost"), 0)::float AS revenue
    FROM maintenances
    WHERE ${Prisma.join(conditions, " AND ")}
    GROUP BY period
    ORDER BY period ASC
  `

  return rows.map((r) => ({ period: r.period, count: r.count, revenue: r.revenue }))
}

/**
 * Desglose por estado de la mantención (no de pago) — a diferencia del resto
 * de Contabilidad, acá SÍ se incluyen las `CANCELADA` a propósito: sirve
 * para ver de un vistazo qué proporción de citas/mantenciones se cancelan.
 */
export async function getMaintenanceStatusBreakdown(filters: AccountingFilterInput) {
  const where: Record<string, unknown> = {}
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
    }
  }
  if (filters.collaboratorId) where.collaboratorId = filters.collaboratorId

  const byStatus = await prisma.maintenance.groupBy({
    by: ["status"],
    where,
    _count: true,
  })

  return byStatus.map((g) => ({ status: g.status, count: g._count }))
}
