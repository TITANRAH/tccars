import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createHighlight,
  getActiveHighlight,
} from "@/features/highlight/services/highlight.service"
import type { HighlightInput } from "@/features/highlight/schemas/highlight.schema"

describe("getActiveHighlight", () => {
  it("only asks for the active one, most recent first", async () => {
    prismaMock.highlight.findFirst.mockResolvedValue(null)

    await getActiveHighlight()

    expect(prismaMock.highlight.findFirst).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    })
  })
})

describe("createHighlight", () => {
  it("stores an empty imageUrl as null", async () => {
    prismaMock.highlight.create.mockResolvedValue({} as never)

    const input: HighlightInput = {
      title: "Nuevo scanner OBD2",
      description: "Llegó tecnología de diagnóstico de última generación al taller.",
      imageUrl: "",
      ctaLabel: "Ver más",
      ctaHref: "/servicios/scanner",
      active: true,
    }
    await createHighlight(input)

    expect(prismaMock.highlight.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageUrl: null }) })
    )
  })
})
