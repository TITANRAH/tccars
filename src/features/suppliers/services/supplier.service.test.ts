import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import { createSupplier, listActiveSuppliers } from "@/features/suppliers/services/supplier.service"
import type { SupplierInput } from "@/features/suppliers/schemas/supplier.schema"

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
