import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createVehicle,
  listClients,
  listVehicles,
  searchVehiclesByPatente,
} from "@/features/vehicles/services/vehicle.service"
import type { VehicleInput } from "@/features/vehicles/schemas/vehicle.schema"

describe("listVehicles", () => {
  it("paginates with a fixed page size of 20", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)
    prismaMock.vehicle.count.mockResolvedValue(41)

    const result = await listVehicles(undefined, 2)

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
  })

  it("always reports at least 1 total page, even with zero vehicles", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)
    prismaMock.vehicle.count.mockResolvedValue(0)

    const result = await listVehicles()
    expect(result.totalPages).toBe(1)
  })

  it("filters by patente (uppercased) when a query is given", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)
    prismaMock.vehicle.count.mockResolvedValue(0)

    await listVehicles("ab12")

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patente: { contains: "AB12" } } })
    )
  })
})

describe("listClients", () => {
  it("paginates with a fixed page size of 20 and only lists CLIENT role", async () => {
    prismaMock.user.findMany.mockResolvedValue([] as never)
    prismaMock.user.count.mockResolvedValue(41)

    const result = await listClients(undefined, 2)

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "CLIENT" }, skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
  })

  it("adds a name/email search filter when a query is given", async () => {
    prismaMock.user.findMany.mockResolvedValue([] as never)
    prismaMock.user.count.mockResolvedValue(0)

    await listClients("sergio")

    const callArgs = prismaMock.user.findMany.mock.calls[0]?.[0]
    expect(callArgs?.where).toMatchObject({ role: "CLIENT", OR: expect.any(Array) })
  })
})

describe("searchVehiclesByPatente", () => {
  it("uppercases the query before searching", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)

    await searchVehiclesByPatente("ab12")

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patente: { contains: "AB12" } } })
    )
  })
})

describe("createVehicle", () => {
  it("stores an empty color as null instead of an empty string", async () => {
    prismaMock.vehicle.create.mockResolvedValue({} as never)

    const input: VehicleInput = {
      patente: "AB1234",
      marca: "Chevrolet",
      modelo: "Sail",
      clientId: "client-1",
      color: "",
    }
    await createVehicle(input)

    expect(prismaMock.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ color: null }) })
    )
  })
})
