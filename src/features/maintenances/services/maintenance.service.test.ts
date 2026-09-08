import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createMaintenanceForN8n,
  linkFicha,
  listOpenMaintenancesForN8n,
  MaintenanceNotFoundError,
  updateMaintenanceForN8n,
} from "@/features/maintenances/services/maintenance.service"

describe("createMaintenanceForN8n", () => {
  it("defaults to EN_PROCESO when n8n doesn't send a status", async () => {
    prismaMock.maintenance.create.mockResolvedValue({ id: "m1", folio: 1 } as never)

    await createMaintenanceForN8n("vehicle-1", { description: "Ruido en el motor" })

    expect(prismaMock.maintenance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "EN_PROCESO" }),
      })
    )
  })

  it("respects an explicit status if n8n sends one", async () => {
    prismaMock.maintenance.create.mockResolvedValue({ id: "m1", folio: 1 } as never)

    await createMaintenanceForN8n("vehicle-1", {
      description: "Revisión rápida",
      status: "COMPLETADA",
    })

    expect(prismaMock.maintenance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETADA" }),
      })
    )
  })

  it("defaults all costs to 0 and computes totalCost when none are sent", async () => {
    prismaMock.maintenance.create.mockResolvedValue({ id: "m1", folio: 1 } as never)

    await createMaintenanceForN8n("vehicle-1", { description: "Cambio de aceite" })

    expect(prismaMock.maintenance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          laborCost: 0,
          partsCost: 0,
          additionalCost: 0,
          totalCost: 0,
        }),
      })
    )
  })
})

describe("updateMaintenanceForN8n", () => {
  it("preserves costs that aren't sent in the PATCH instead of zeroing them out", async () => {
    prismaMock.maintenance.findUniqueOrThrow.mockResolvedValue({
      id: "m1",
      laborCost: 15000,
      partsCost: 8000,
      additionalCost: 0,
    } as never)
    prismaMock.maintenance.update.mockResolvedValue({} as never)

    // n8n solo manda additionalCost — laborCost/partsCost ya cargados no deben perderse
    await updateMaintenanceForN8n("m1", { additionalCost: 5000 })

    expect(prismaMock.maintenance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "m1" },
        data: expect.objectContaining({
          laborCost: 15000,
          partsCost: 8000,
          additionalCost: 5000,
          totalCost: 28000,
        }),
      })
    )
  })

  it("overrides a cost that is explicitly sent", async () => {
    prismaMock.maintenance.findUniqueOrThrow.mockResolvedValue({
      id: "m1",
      laborCost: 15000,
      partsCost: 8000,
      additionalCost: 0,
    } as never)
    prismaMock.maintenance.update.mockResolvedValue({} as never)

    await updateMaintenanceForN8n("m1", { laborCost: 20000 })

    expect(prismaMock.maintenance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ laborCost: 20000, partsCost: 8000, totalCost: 28000 }),
      })
    )
  })

  it("only sets status when explicitly sent (closing the maintenance)", async () => {
    prismaMock.maintenance.findUniqueOrThrow.mockResolvedValue({
      id: "m1",
      laborCost: 0,
      partsCost: 0,
      additionalCost: 0,
    } as never)
    prismaMock.maintenance.update.mockResolvedValue({} as never)

    await updateMaintenanceForN8n("m1", { status: "COMPLETADA" })

    expect(prismaMock.maintenance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETADA" }) })
    )
  })
})

describe("listOpenMaintenancesForN8n", () => {
  it("only asks for AGENDADA/EN_PROCESO maintenances of that vehicle", async () => {
    prismaMock.maintenance.findMany.mockResolvedValue([] as never)

    await listOpenMaintenancesForN8n("vehicle-1")

    expect(prismaMock.maintenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vehicleId: "vehicle-1", status: { in: ["AGENDADA", "EN_PROCESO"] } },
      })
    )
  })

  it("also filters by collaboratorId when provided", async () => {
    prismaMock.maintenance.findMany.mockResolvedValue([] as never)

    await listOpenMaintenancesForN8n("vehicle-1", "collab-1")

    expect(prismaMock.maintenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          vehicleId: "vehicle-1",
          status: { in: ["AGENDADA", "EN_PROCESO"] },
          collaboratorId: "collab-1",
        },
      })
    )
  })
})

describe("linkFicha", () => {
  it("updates the maintenance directly when maintenanceId is given", async () => {
    prismaMock.maintenance.update.mockResolvedValue({ id: "m1" } as never)

    await linkFicha({ maintenanceId: "m1" }, "drive-file-1", "https://drive/1")

    expect(prismaMock.maintenance.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { fichaDriveFileId: "drive-file-1", fichaUrl: "https://drive/1" },
    })
  })

  it("falls back to the most recent maintenance of that patente when no id is given", async () => {
    prismaMock.maintenance.findFirst.mockResolvedValue({ id: "latest-one" } as never)
    prismaMock.maintenance.update.mockResolvedValue({} as never)

    await linkFicha({ patente: "ab1234" }, "drive-file-2")

    expect(prismaMock.maintenance.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vehicle: { patente: "AB1234" } },
        orderBy: { createdAt: "desc" },
      })
    )
    expect(prismaMock.maintenance.update).toHaveBeenCalledWith({
      where: { id: "latest-one" },
      data: { fichaDriveFileId: "drive-file-2", fichaUrl: null },
    })
  })

  it("throws MaintenanceNotFoundError when the patente has no maintenances at all", async () => {
    prismaMock.maintenance.findFirst.mockResolvedValue(null)

    await expect(linkFicha({ patente: "ZZ9999" }, "drive-file-3")).rejects.toThrow(
      MaintenanceNotFoundError
    )
  })
})
