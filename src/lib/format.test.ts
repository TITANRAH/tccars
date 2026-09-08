import { describe, expect, it } from "vitest"
import { formatCLP, formatDate, formatDateTime } from "@/lib/format"

describe("formatCLP", () => {
  it("formats a number as Chilean pesos without decimals", () => {
    expect(formatCLP(25000)).toBe("$25.000")
  })

  it("accepts a string or Decimal-like value", () => {
    expect(formatCLP("18000")).toBe("$18.000")
    expect(formatCLP({ toString: () => "1000" })).toBe("$1.000")
  })

  it("formats zero", () => {
    expect(formatCLP(0)).toBe("$0")
  })
})

describe("formatDate / formatDateTime", () => {
  it("formats a date in es-CL medium style", () => {
    expect(formatDate("2026-09-07T12:00:00Z")).toMatch(/2026/)
  })

  it("formats a date+time, and is a longer string than the date-only version", () => {
    const dateOnly = formatDate("2026-09-07T15:30:00")
    const dateTime = formatDateTime("2026-09-07T15:30:00")
    expect(dateTime).toMatch(/2026/)
    expect(dateTime.length).toBeGreaterThan(dateOnly.length)
  })
})
