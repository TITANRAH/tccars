import { describe, expect, it } from "vitest"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"

describe("calculateMaintenanceAlert", () => {
  it("returns null when there is no record", () => {
    expect(calculateMaintenanceAlert(null)).toBeNull()
  })

  it("returns null when mileage or nextServiceMileage is missing", () => {
    expect(
      calculateMaintenanceAlert({ mileage: null, nextServiceMileage: 50_000, createdAt: new Date() })
    ).toBeNull()
    expect(
      calculateMaintenanceAlert({ mileage: 40_000, nextServiceMileage: null, createdAt: new Date() })
    ).toBeNull()
  })

  it("is not due soon right after the maintenance, far from the threshold", () => {
    const result = calculateMaintenanceAlert({
      mileage: 40_000,
      nextServiceMileage: 60_000,
      createdAt: new Date(),
    })
    expect(result).not.toBeNull()
    expect(result?.dueSoon).toBe(false)
    expect(result?.estimatedCurrentMileage).toBe(40_000)
    expect(result?.remainingKm).toBe(20_000)
  })

  it("flags dueSoon once the estimated mileage is within 10,000km of the next service", () => {
    // 41 días atrás, a 40km/día = 1640km recorridos → estimado 41640
    const createdAt = new Date(Date.now() - 41 * 24 * 60 * 60 * 1000)
    const result = calculateMaintenanceAlert({
      mileage: 40_000,
      nextServiceMileage: 50_000,
      createdAt,
    })
    expect(result?.estimatedCurrentMileage).toBe(41_640)
    expect(result?.remainingKm).toBe(8_360)
    expect(result?.dueSoon).toBe(true)
  })

  it("never estimates negative days for a maintenance dated in the future", () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const result = calculateMaintenanceAlert({
      mileage: 40_000,
      nextServiceMileage: 60_000,
      createdAt: futureDate,
    })
    expect(result?.estimatedCurrentMileage).toBe(40_000)
  })

  it("uses scheduledAt (the real service date) instead of createdAt when both are present", () => {
    // La mantención se cargó en la base hoy (createdAt), pero el servicio fue
    // hace 41 días (scheduledAt) — el estimado debe basarse en scheduledAt.
    const scheduledAt = new Date(Date.now() - 41 * 24 * 60 * 60 * 1000)
    const result = calculateMaintenanceAlert({
      mileage: 40_000,
      nextServiceMileage: 50_000,
      createdAt: new Date(),
      scheduledAt,
    })
    expect(result?.estimatedCurrentMileage).toBe(41_640)
    expect(result?.dueSoon).toBe(true)
  })
})
