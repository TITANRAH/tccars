import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createCollaboratorProfile,
  listCollaborators,
  setCollaboratorActive,
} from "@/features/collaborators/services/collaborator.service"
import type { CollaboratorInput } from "@/features/collaborators/schemas/collaborator.schema"

const baseInput: CollaboratorInput = {
  firstName: "Carlos",
  lastName: "Soto",
  email: "Carlos@TCCars.cl",
  role: "COLLABORATOR",
}

describe("createCollaboratorProfile", () => {
  it("lowercases the email and turns empty optional fields into null", async () => {
    prismaMock.user.create.mockResolvedValue({} as never)

    await createCollaboratorProfile(baseInput, "hash123")

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "carlos@tccars.cl",
          phone: null,
          rut: null,
          position: null,
          birthDate: null,
        }),
      })
    )
  })

  it("parses birthDate/startDate strings into real Date objects", async () => {
    prismaMock.user.create.mockResolvedValue({} as never)

    await createCollaboratorProfile(
      { ...baseInput, birthDate: "1990-05-20", startDate: "2020-01-10" },
      "hash123"
    )

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          birthDate: new Date("1990-05-20"),
          startDate: new Date("2020-01-10"),
        }),
      })
    )
  })
})

describe("listCollaborators", () => {
  it("paginates with a fixed page size of 20 and only lists staff roles", async () => {
    prismaMock.user.findMany.mockResolvedValue([] as never)
    prismaMock.user.count.mockResolvedValue(41)

    const result = await listCollaborators(undefined, 2)

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: { in: ["ADMIN", "COLLABORATOR"] } },
        skip: 20,
        take: 20,
      })
    )
    expect(result.totalPages).toBe(3)
  })

  it("adds a name/email search filter when a query is given", async () => {
    prismaMock.user.findMany.mockResolvedValue([] as never)
    prismaMock.user.count.mockResolvedValue(0)

    await listCollaborators("carlos")

    const callArgs = prismaMock.user.findMany.mock.calls[0]?.[0]
    expect(callArgs?.where).toMatchObject({
      role: { in: ["ADMIN", "COLLABORATOR"] },
      OR: expect.any(Array),
    })
  })
})

describe("setCollaboratorActive", () => {
  it("only touches the active field", async () => {
    prismaMock.user.update.mockResolvedValue({} as never)

    await setCollaboratorActive("collab-1", false)

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "collab-1" },
      data: { active: false },
    })
  })
})
