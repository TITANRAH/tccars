import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createReference,
  listPublishedReferences,
} from "@/features/references/services/reference.service"
import type { ReferenceInput } from "@/features/references/schemas/reference.schema"

describe("listPublishedReferences", () => {
  it("only asks for published references, ordered by 'order' then most recent", async () => {
    prismaMock.reference.findMany.mockResolvedValue([] as never)

    await listPublishedReferences()

    expect(prismaMock.reference.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })
  })
})

describe("createReference", () => {
  it("stores an empty imageUrl as null", async () => {
    prismaMock.reference.create.mockResolvedValue({} as never)

    const input: ReferenceInput = {
      authorName: "Marcela Soto",
      comment: "Excelente atención, quedé muy conforme con el trabajo en mi auto.",
      imageUrl: "",
      order: 0,
      published: true,
    }
    await createReference(input)

    expect(prismaMock.reference.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageUrl: null }) })
    )
  })
})
