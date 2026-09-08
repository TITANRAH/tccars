import { describe, expect, it, type Mock } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"

// El groupBy de Prisma tiene una firma con muchísimos genéricos condicionales
// (según by/orderBy/select) que vitest-mock-extended no logra inferir bien
// para .mockResolvedValue/.mockImplementation — se castea a un mock genérico.
const groupByMock = () => prismaMock.maintenance.groupBy as unknown as Mock
import {
  getAccountingSummary,
  listMaintenancesForAccounting,
} from "@/features/accounting/services/accounting.service"

describe("listMaintenancesForAccounting", () => {
  it("always excludes CANCELADA maintenances", async () => {
    prismaMock.maintenance.findMany.mockResolvedValue([] as never)
    prismaMock.maintenance.count.mockResolvedValue(0)

    await listMaintenancesForAccounting({})

    expect(prismaMock.maintenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: { not: "CANCELADA" } }) })
    )
  })

  it("filters by date range and collaborator when provided", async () => {
    prismaMock.maintenance.findMany.mockResolvedValue([] as never)
    prismaMock.maintenance.count.mockResolvedValue(0)

    await listMaintenancesForAccounting({
      from: "2026-01-01",
      to: "2026-01-31",
      collaboratorId: "collab-1",
    })

    expect(prismaMock.maintenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          collaboratorId: "collab-1",
          createdAt: { gte: new Date("2026-01-01"), lte: new Date("2026-01-31T23:59:59") },
        }),
      })
    )
  })

  it("paginates with a fixed page size of 20", async () => {
    prismaMock.maintenance.findMany.mockResolvedValue([] as never)
    prismaMock.maintenance.count.mockResolvedValue(45)

    const result = await listMaintenancesForAccounting({}, 2)

    expect(prismaMock.maintenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
    expect(result.page).toBe(2)
  })
})

describe("getAccountingSummary", () => {
  it("converts Decimal sums to plain numbers and defaults to 0 when there's nothing", async () => {
    prismaMock.maintenance.aggregate.mockResolvedValue({
      _sum: { totalCost: null, laborCost: null, partsCost: null },
      _count: 0,
    } as never)
    groupByMock().mockResolvedValue([])

    const result = await getAccountingSummary({})

    expect(result.totalRevenue).toBe(0)
    expect(result.totalLabor).toBe(0)
    expect(result.count).toBe(0)
    expect(result.byCollaborator).toEqual([])
  })

  it("attaches collaborator details to each byCollaborator group", async () => {
    prismaMock.maintenance.aggregate.mockResolvedValue({
      _sum: { totalCost: 100000, laborCost: 60000, partsCost: 40000 },
      _count: 3,
    } as never)
    groupByMock().mockImplementation((args: { by: string[] }) => {
      if (args.by[0] === "collaboratorId") {
        return Promise.resolve([
          { collaboratorId: "collab-1", _sum: { totalCost: 100000 }, _count: 3 },
        ])
      }
      return Promise.resolve([{ paymentStatus: "PAGADO", _sum: { totalCost: 100000 }, _count: 3 }])
    })
    prismaMock.user.findMany.mockResolvedValue([
      { id: "collab-1", firstName: "Carlos", lastName: "Soto" },
    ] as never)

    const result = await getAccountingSummary({})

    expect(result.byCollaborator).toEqual([
      {
        collaboratorId: "collab-1",
        collaborator: { id: "collab-1", firstName: "Carlos", lastName: "Soto" },
        total: 100000,
        count: 3,
      },
    ])
    expect(result.byPaymentStatus).toEqual([{ status: "PAGADO", total: 100000, count: 3 }])
  })
})
