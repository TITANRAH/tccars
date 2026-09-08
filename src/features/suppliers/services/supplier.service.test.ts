import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createSupplier,
  listActiveSuppliers,
  listSuppliers,
} from "@/features/suppliers/services/supplier.service"
import type { SupplierInput } from "@/features/suppliers/schemas/supplier.schema"

describe("listSuppliers", () => {
  it("paginates with a fixed page size of 20", async () => {
    prismaMock.supplier.findMany.mockResolvedValue([] as never)
    prismaMock.supplier.count.mockResolvedValue(41)

    const result = await listSuppliers(undefined, 2)

    expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
  })

  it("filters by name/email when a query is given", async () => {
    prismaMock.supplier.findMany.mockResolvedValue([] as never)
    prismaMock.supplier.count.mockResolvedValue(0)

    await listSuppliers("sur")

    const callArgs = prismaMock.supplier.findMany.mock.calls[0]?.[0]
    expect(callArgs?.where).toMatchObject({ OR: expect.any(Array) })
  })
})

describe("listActiveSuppliers", () => {
  it("only asks for active suppliers", async () => {
    prismaMock.supplier.findMany.mockResolvedValue([] as never)

    await listActiveSuppliers()

    expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    )
  })
})

describe("createSupplier", () => {
  it("turns empty optional fields into null", async () => {
    prismaMock.supplier.create.mockResolvedValue({} as never)

    const input: SupplierInput = {
      name: "Repuestos Sur",
      email: "contacto@repsur.cl",
      specialty: "",
      phone: "",
      active: true,
    }
    await createSupplier(input)

    expect(prismaMock.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ specialty: null, phone: null }) })
    )
  })
})
