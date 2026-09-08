import { describe, expect, it } from "vitest"
import { newClientSchema, normalizePatente, vehicleSchema } from "@/features/vehicles/schemas/vehicle.schema"

describe("normalizePatente", () => {
  it("uppercases and strips spaces, dots and dashes", () => {
    expect(normalizePatente("sj.fr-33")).toBe("SJFR33")
    expect(normalizePatente("ab 1234")).toBe("AB1234")
  })
})

describe("vehicleSchema", () => {
  const base = {
    patente: "ab1234",
    marca: "Chevrolet",
    modelo: "Sail",
    clientId: "client-1",
  }

  it("accepts a valid vehicle and normalizes the patente", () => {
    const result = vehicleSchema.parse(base)
    expect(result.patente).toBe("AB1234")
  })

  it("rejects a patente that is too short or has invalid characters", () => {
    expect(vehicleSchema.safeParse({ ...base, patente: "AB" }).success).toBe(false)
    expect(vehicleSchema.safeParse({ ...base, patente: "AB-12@34" }).success).toBe(false)
  })

  it("requires marca, modelo and clientId", () => {
    expect(vehicleSchema.safeParse({ ...base, marca: "" }).success).toBe(false)
    expect(vehicleSchema.safeParse({ ...base, modelo: "" }).success).toBe(false)
    expect(vehicleSchema.safeParse({ ...base, clientId: "" }).success).toBe(false)
  })

  it("rejects an out-of-range year but allows omitting it", () => {
    expect(vehicleSchema.safeParse({ ...base, anio: 1900 }).success).toBe(false)
    expect(vehicleSchema.safeParse({ ...base, anio: 2026 }).success).toBe(true)
    expect(vehicleSchema.safeParse(base).success).toBe(true)
  })
})

describe("newClientSchema", () => {
  it("lowercases the email", () => {
    const result = newClientSchema.parse({
      firstName: "Juan",
      lastName: "Pérez",
      email: "Juan.Perez@Correo.CL",
    })
    expect(result.email).toBe("juan.perez@correo.cl")
  })

  it("rejects a one-letter first or last name", () => {
    expect(
      newClientSchema.safeParse({ firstName: "J", lastName: "Pérez", email: "j@correo.cl" }).success
    ).toBe(false)
  })
})
