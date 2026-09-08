import { describe, expect, it } from "vitest"
import { maintenanceSchema } from "@/features/maintenances/schemas/maintenance.schema"

const base = {
  vehicleId: "vehicle-1",
  type: "MANTENCION" as const,
  status: "AGENDADA" as const,
  description: "Cambio de aceite y filtro",
  paymentStatus: "PENDIENTE" as const,
}

describe("maintenanceSchema", () => {
  it("accepts a minimal valid maintenance and defaults costs to 0", () => {
    const result = maintenanceSchema.parse(base)
    expect(result.laborCost).toBe(0)
    expect(result.partsCost).toBe(0)
    expect(result.additionalCost).toBe(0)
  })

  it("rejects a description shorter than 5 characters", () => {
    expect(maintenanceSchema.safeParse({ ...base, description: "abc" }).success).toBe(false)
  })

  it("rejects negative costs and mileage", () => {
    expect(maintenanceSchema.safeParse({ ...base, laborCost: -100 }).success).toBe(false)
    expect(maintenanceSchema.safeParse({ ...base, mileage: -1 }).success).toBe(false)
  })

  it("only accepts the four defined statuses", () => {
    expect(maintenanceSchema.safeParse({ ...base, status: "EN_PROCESO" }).success).toBe(true)
    expect(maintenanceSchema.safeParse({ ...base, status: "COMPLETADA" }).success).toBe(true)
    expect(maintenanceSchema.safeParse({ ...base, status: "OTRO" }).success).toBe(false)
  })

  it("coerces numeric string costs", () => {
    const result = maintenanceSchema.parse({ ...base, laborCost: "15000" })
    expect(result.laborCost).toBe(15000)
  })
})
