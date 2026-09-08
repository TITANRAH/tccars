import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createVehicle,
  listVehicles,
  searchVehiclesByPatente,
} from "@/features/vehicles/services/vehicle.service"
import type { VehicleInput } from "@/features/vehicles/schemas/vehicle.schema"

describe("listVehicles", () => {
  it("paginates with a fixed page size of 20", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)
    prismaMock.vehicle.count.mockResolvedValue(41)

    const result = await listVehicles(2)

    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
  })

  it("always reports at least 1 total page, even with zero vehicles", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([] as never)
    prismaMock.vehicle.count.mockResolvedValue(0)

    const result = await listVehicles(1)
    expect(result.totalPages).toBe(1)
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
