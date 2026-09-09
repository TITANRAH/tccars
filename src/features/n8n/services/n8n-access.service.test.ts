import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import { findUserRoleByPhone } from "@/features/n8n/services/n8n-access.service"

describe("findUserRoleByPhone", () => {
  it("only matches active users by phone, regardless of role", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    await findUserRoleByPhone("+56912345678")

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { phone: "56912345678", active: true },
      select: { id: true, firstName: true, lastName: true, role: true },
    })
  })

  it("normalizes a phone with symbols before matching, to match WhatsApp's raw digit format", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    await findUserRoleByPhone("+56 9 1234 5678")

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { phone: "56912345678", active: true },
      select: { id: true, firstName: true, lastName: true, role: true },
    })
  })
})
