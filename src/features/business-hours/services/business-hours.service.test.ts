import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  isWithinBusinessHours,
  listBusinessHours,
} from "@/features/business-hours/services/business-hours.service"

describe("listBusinessHours", () => {
  it("fills in missing days with the default schedule", async () => {
    prismaMock.businessHours.findMany.mockResolvedValue([
      { dayOfWeek: 1, isOpen: true, openTime: "10:00", closeTime: "19:00", updatedAt: new Date() },
    ] as never)

    const days = await listBusinessHours()

    expect(days).toHaveLength(7)
    expect(days.find((d) => d.dayOfWeek === 1)).toMatchObject({ openTime: "10:00", closeTime: "19:00" })
    expect(days.find((d) => d.dayOfWeek === 0)).toMatchObject({ isOpen: false })
    expect(days.find((d) => d.dayOfWeek === 2)).toMatchObject({ isOpen: true, openTime: "09:00" })
  })
})

describe("isWithinBusinessHours", () => {
  it("returns false when the day is marked closed", async () => {
    prismaMock.businessHours.findUnique.mockResolvedValue({
      dayOfWeek: 0,
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
      updatedAt: new Date(),
    } as never)

    // Un domingo cualquiera a mediodía.
    const sunday = new Date("2026-09-13T12:00:00")
    expect(await isWithinBusinessHours(sunday)).toBe(false)
  })

  it("returns true when inside the open window", async () => {
    prismaMock.businessHours.findUnique.mockResolvedValue({
      dayOfWeek: 1,
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      updatedAt: new Date(),
    } as never)

    const mondayAt10 = new Date("2026-09-14T10:00:00")
    expect(await isWithinBusinessHours(mondayAt10)).toBe(true)
  })

  it("returns false when outside the open window (before opening)", async () => {
    prismaMock.businessHours.findUnique.mockResolvedValue({
      dayOfWeek: 1,
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      updatedAt: new Date(),
    } as never)

    const mondayAt7 = new Date("2026-09-14T07:00:00")
    expect(await isWithinBusinessHours(mondayAt7)).toBe(false)
  })

  it("falls back to the default schedule when no row exists for that day", async () => {
    prismaMock.businessHours.findUnique.mockResolvedValue(null)

    const mondayAt10 = new Date("2026-09-14T10:00:00")
    expect(await isWithinBusinessHours(mondayAt10)).toBe(true)
  })
})
