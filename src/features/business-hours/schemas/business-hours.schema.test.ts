import { describe, expect, it } from "vitest"
import {
  businessHoursExceptionSchema,
  businessHoursSchema,
} from "@/features/business-hours/schemas/business-hours.schema"

function daysWith(overrides: Partial<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }>[]) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek !== 0,
    openTime: "09:00",
    closeTime: "18:00",
    ...overrides[dayOfWeek],
  }))
}

describe("businessHoursSchema", () => {
  it("accepts a full valid week", () => {
    const result = businessHoursSchema.safeParse({ days: daysWith([]) })
    expect(result.success).toBe(true)
  })

  it("rejects when there aren't exactly 7 days", () => {
    const result = businessHoursSchema.safeParse({ days: daysWith([]).slice(0, 6) })
    expect(result.success).toBe(false)
  })

  it("rejects an open day where closeTime is not after openTime", () => {
    const days = daysWith([{}, { openTime: "18:00", closeTime: "09:00" }])
    const result = businessHoursSchema.safeParse({ days })
    expect(result.success).toBe(false)
  })

  it("allows openTime >= closeTime on a closed day (values are ignored)", () => {
    const days = daysWith([{ isOpen: false, openTime: "18:00", closeTime: "09:00" }])
    const result = businessHoursSchema.safeParse({ days })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid time format", () => {
    const days = daysWith([{}, { openTime: "9:00" }])
    const result = businessHoursSchema.safeParse({ days })
    expect(result.success).toBe(false)
  })
})

describe("businessHoursExceptionSchema", () => {
  it("accepts a closed-day exception with no times", () => {
    const result = businessHoursExceptionSchema.safeParse({
      date: "2026-09-18",
      isOpen: false,
      openTime: "",
      closeTime: "",
      note: "Fiestas Patrias",
    })
    expect(result.success).toBe(true)
  })

  it("accepts an open-day exception with a valid time window", () => {
    const result = businessHoursExceptionSchema.safeParse({
      date: "2026-09-18",
      isOpen: true,
      openTime: "10:00",
      closeTime: "13:00",
      note: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an open-day exception missing times", () => {
    const result = businessHoursExceptionSchema.safeParse({
      date: "2026-09-18",
      isOpen: true,
      openTime: "",
      closeTime: "",
      note: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid date format", () => {
    const result = businessHoursExceptionSchema.safeParse({
      date: "18-09-2026",
      isOpen: false,
      openTime: "",
      closeTime: "",
      note: "",
    })
    expect(result.success).toBe(false)
  })
})
