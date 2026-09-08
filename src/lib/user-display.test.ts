import { describe, expect, it, vi } from "vitest"
import { calculateAge, fullName, toStaffOptions } from "@/lib/user-display"

describe("fullName", () => {
  it("joins first and last name with a space", () => {
    expect(fullName({ firstName: "Carlos", lastName: "Mecánico" })).toBe("Carlos Mecánico")
  })

  it("drops an empty last name instead of leaving a trailing space", () => {
    expect(fullName({ firstName: "Carlos", lastName: "" })).toBe("Carlos")
  })
})

describe("toStaffOptions", () => {
  it("maps staff users to {id, name} options", () => {
    expect(
      toStaffOptions([
        { id: "1", firstName: "Ana", lastName: "Soto" },
        { id: "2", firstName: "Luis", lastName: "Pérez" },
      ])
    ).toEqual([
      { id: "1", name: "Ana Soto" },
      { id: "2", name: "Luis Pérez" },
    ])
  })
})

describe("calculateAge", () => {
  it("returns null when there is no birth date", () => {
    expect(calculateAge(null)).toBeNull()
    expect(calculateAge(undefined)).toBeNull()
  })

  it("counts a full year once the birthday already happened this year", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-07"))
    expect(calculateAge(new Date("2000-01-15"))).toBe(26)
    vi.useRealTimers()
  })

  it("does not count this year yet if the birthday hasn't happened", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-07"))
    expect(calculateAge(new Date("2000-12-25"))).toBe(25)
    vi.useRealTimers()
  })
})
