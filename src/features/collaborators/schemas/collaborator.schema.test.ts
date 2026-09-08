import { describe, expect, it } from "vitest"
import { collaboratorSchema } from "@/features/collaborators/schemas/collaborator.schema"

const base = {
  firstName: "Carlos",
  lastName: "Soto",
  email: "carlos@tccars.cl",
  role: "COLLABORATOR" as const,
}

describe("collaboratorSchema", () => {
  it("accepts a minimal valid collaborator, with optional fields empty", () => {
    expect(collaboratorSchema.safeParse(base).success).toBe(true)
  })

  it("accepts the optional profile fields (RUT, cargo, fechas)", () => {
    const result = collaboratorSchema.parse({
      ...base,
      rut: "12.345.678-9",
      position: "Mecánico jefe",
      birthDate: "1990-01-01",
      startDate: "2020-03-01",
    })
    expect(result.rut).toBe("12.345.678-9")
    expect(result.position).toBe("Mecánico jefe")
  })

  it("only allows COLLABORATOR or ADMIN as role", () => {
    expect(collaboratorSchema.safeParse({ ...base, role: "CLIENT" }).success).toBe(false)
    expect(collaboratorSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(true)
  })

  it("rejects an invalid email", () => {
    expect(collaboratorSchema.safeParse({ ...base, email: "no-es-correo" }).success).toBe(false)
  })
})
