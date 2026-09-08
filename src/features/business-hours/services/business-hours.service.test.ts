import { beforeEach, describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  deleteBusinessHoursException,
  isWithinBusinessHours,
  listBusinessHours,
  listUpcomingBusinessHoursExceptions,
  saveBusinessHoursException,
} from "@/features/business-hours/services/business-hours.service"

beforeEach(() => {
  // Por defecto, sin excepción para la fecha consultada — así los tests de
  // horario semanal existentes no se ven afectados por la nueva tabla.
  prismaMock.businessHoursException.findUnique.mockResolvedValue(null)
})

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

  it("closes the day entirely when a closed exception exists, ignoring the weekly schedule", async () => {
    prismaMock.businessHoursException.findUnique.mockResolvedValue({
      date: "2026-09-14",
      isOpen: false,
      openTime: null,
      closeTime: null,
      note: "Feriado",
      updatedAt: new Date(),
    } as never)

    const mondayAt10 = new Date("2026-09-14T10:00:00")
    expect(await isWithinBusinessHours(mondayAt10)).toBe(false)
    expect(prismaMock.businessHours.findUnique).not.toHaveBeenCalled()
  })

  it("uses the exception's special hours instead of the weekly schedule when it is open", async () => {
    prismaMock.businessHoursException.findUnique.mockResolvedValue({
      date: "2026-09-14",
      isOpen: true,
      openTime: "10:00",
      closeTime: "13:00",
      note: "Media jornada",
      updatedAt: new Date(),
    } as never)

    expect(await isWithinBusinessHours(new Date("2026-09-14T11:00:00"))).toBe(true)
    expect(await isWithinBusinessHours(new Date("2026-09-14T14:00:00"))).toBe(false)
  })
})

describe("listUpcomingBusinessHoursExceptions", () => {
  it("only queries dates from today onward", async () => {
    prismaMock.businessHoursException.findMany.mockResolvedValue([])

    await listUpcomingBusinessHoursExceptions()

    expect(prismaMock.businessHoursException.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date: "asc" } })
    )
  })
})

describe("saveBusinessHoursException", () => {
  it("clears open/close times when the day is closed", async () => {
    prismaMock.businessHoursException.upsert.mockResolvedValue({} as never)

    await saveBusinessHoursException({
      date: "2026-09-18",
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
      note: "Fiestas Patrias",
    })

    expect(prismaMock.businessHoursException.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: "2026-09-18" },
        update: expect.objectContaining({ openTime: null, closeTime: null }),
      })
    )
  })
})

describe("deleteBusinessHoursException", () => {
  it("deletes by date key", async () => {
    prismaMock.businessHoursException.delete.mockResolvedValue({} as never)

    await deleteBusinessHoursException("2026-09-18")

    expect(prismaMock.businessHoursException.delete).toHaveBeenCalledWith({
      where: { date: "2026-09-18" },
    })
  })
})
