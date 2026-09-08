import { describe, expect, it } from "vitest"
import { supplierSchema } from "@/features/suppliers/schemas/supplier.schema"

describe("supplierSchema", () => {
  it("defaults active to true when omitted", () => {
    const result = supplierSchema.parse({ name: "Repuestos Sur", email: "contacto@repsur.cl" })
    expect(result.active).toBe(true)
  })

  it("respects an explicit active: false", () => {
    const result = supplierSchema.parse({
      name: "Repuestos Sur",
      email: "contacto@repsur.cl",
      active: false,
    })
    expect(result.active).toBe(false)
  })

  it("requires a valid email and a name of at least 2 characters", () => {
    expect(supplierSchema.safeParse({ name: "R", email: "contacto@repsur.cl" }).success).toBe(false)
    expect(supplierSchema.safeParse({ name: "Repuestos Sur", email: "no-es-correo" }).success).toBe(
      false
    )
  })
})
