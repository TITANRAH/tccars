import { describe, expect, it } from "vitest"
import { highlightSchema } from "@/features/highlight/schemas/highlight.schema"

const base = {
  title: "Nuevo scanner OBD2",
  description: "Llegó tecnología de diagnóstico de última generación al taller.",
  ctaHref: "/servicios/scanner",
}

describe("highlightSchema", () => {
  it("accepts a minimal valid highlight and defaults ctaLabel and active", () => {
    const result = highlightSchema.parse(base)
    expect(result.ctaLabel).toBe("Ver más")
    expect(result.active).toBe(true)
  })

  it("rejects a description shorter than 10 characters", () => {
    expect(highlightSchema.safeParse({ ...base, description: "corto" }).success).toBe(false)
  })

  it("requires a ctaHref", () => {
    expect(highlightSchema.safeParse({ ...base, ctaHref: "" }).success).toBe(false)
  })

  it("allows an empty imageUrl but rejects an invalid one", () => {
    expect(highlightSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(true)
    expect(highlightSchema.safeParse({ ...base, imageUrl: "no-es-url" }).success).toBe(false)
  })
})
