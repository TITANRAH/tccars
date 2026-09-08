import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  AppointmentNotFoundError,
  cancelStalePendingAppointments,
  findSchedulingConflict,
  listUpcomingAppointmentsByPhone,
  updateAppointmentForN8n,
} from "@/features/appointments/services/appointment.service"

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

describe("listUpcomingAppointmentsByPhone", () => {
  it("only asks for non-cancelled, future appointments matching that phone", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([] as never)

    await listUpcomingAppointmentsByPhone("+56912345678")

    const callArgs = prismaMock.appointment.findMany.mock.calls[0]?.[0]
    expect(callArgs?.where).toMatchObject({
      contactPhone: "+56912345678",
      status: { not: "CANCELADA" },
    })
    expect(callArgs?.where?.scheduledAt).toHaveProperty("gte")
  })
})

describe("updateAppointmentForN8n", () => {
  it("throws AppointmentNotFoundError when the appointment doesn't exist", async () => {
    prismaMock.appointment.findUnique.mockResolvedValue(null)

    await expect(updateAppointmentForN8n("missing", { status: "CANCELADA" })).rejects.toThrow(
      AppointmentNotFoundError
    )
  })

  it("updates only the given fields", async () => {
    prismaMock.appointment.findUnique.mockResolvedValue({ id: "apt-1" } as never)
    prismaMock.appointment.update.mockResolvedValue({ id: "apt-1" } as never)

    await updateAppointmentForN8n("apt-1", { status: "CANCELADA" })

    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: "apt-1" },
      data: { scheduledAt: undefined, status: "CANCELADA", notes: undefined },
    })
  })
})

describe("cancelStalePendingAppointments", () => {
  it("only cancels PENDIENTE appointments whose scheduledAt already passed", async () => {
    prismaMock.appointment.updateMany.mockResolvedValue({ count: 3 } as never)

    const count = await cancelStalePendingAppointments()

    expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
      where: { status: "PENDIENTE", scheduledAt: { lt: expect.any(Date) } },
      data: { status: "CANCELADA" },
    })
    expect(count).toBe(3)
  })
})
