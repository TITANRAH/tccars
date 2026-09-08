import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import { findSchedulingConflict } from "@/features/appointments/services/appointment.service"

describe("findSchedulingConflict", () => {
  it("looks for non-cancelled appointments within a ±60 minute window", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null)

    const scheduledAt = new Date("2026-09-15T10:30:00")
    await findSchedulingConflict(scheduledAt)

    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith({
      where: {
        id: undefined,
        status: { not: "CANCELADA" },
        scheduledAt: {
          gt: new Date("2026-09-15T09:30:00"),
          lt: new Date("2026-09-15T11:30:00"),
        },
      },
    })
  })

  it("excludes the given appointment id (editing without conflicting with itself)", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null)

    await findSchedulingConflict(new Date("2026-09-15T10:30:00"), "self-1")

    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: "self-1" } }) })
    )
  })

  it("returns the conflicting appointment when the query finds one", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({ id: "existing" } as never)

    const result = await findSchedulingConflict(new Date("2026-09-15T10:30:00"))

    expect(result).toEqual({ id: "existing" })
  })

  it("does not filter by collaborator — a conflict blocks the whole taller, not just one collaborator", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null)

    await findSchedulingConflict(new Date("2026-09-15T10:30:00"))

    const callArgs = prismaMock.appointment.findFirst.mock.calls[0]?.[0]
    expect(callArgs?.where).not.toHaveProperty("collaboratorId")
  })
})
