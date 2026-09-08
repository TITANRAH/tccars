import { describe, expect, it } from "vitest"
import { appointmentSchema } from "@/features/appointments/schemas/appointment.schema"

const base = {
  scheduledAt: "2026-09-15T10:30:00",
  contactName: "Juan Pérez",
  contactPhone: "+56912345678",
  status: "PENDIENTE" as const,
}

describe("appointmentSchema", () => {
  it("accepts a minimal valid appointment", () => {
    expect(appointmentSchema.safeParse(base).success).toBe(true)
  })

  it("requires scheduledAt, contactName and contactPhone", () => {
    expect(appointmentSchema.safeParse({ ...base, scheduledAt: "" }).success).toBe(false)
    expect(appointmentSchema.safeParse({ ...base, contactName: "A" }).success).toBe(false)
    expect(appointmentSchema.safeParse({ ...base, contactPhone: "123" }).success).toBe(false)
  })

  it("allows vehicleId and collaboratorId to be omitted (walk-in client)", () => {
    expect(appointmentSchema.safeParse(base).success).toBe(true)
  })

  it("only accepts the four defined statuses", () => {
    expect(appointmentSchema.safeParse({ ...base, status: "CONFIRMADA" }).success).toBe(true)
    expect(appointmentSchema.safeParse({ ...base, status: "INVALIDO" }).success).toBe(false)
  })
})
