import { prisma } from "@/lib/prisma"
import type { AccountingFilterInput } from "@/features/accounting/schemas/accounting.schema"

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
