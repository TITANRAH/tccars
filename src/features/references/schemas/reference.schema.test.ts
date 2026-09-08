import { describe, expect, it } from "vitest"
import { referenceSchema } from "@/features/references/schemas/reference.schema"

const base = {
  authorName: "Marcela Soto",
  comment: "Excelente atención, quedé muy conforme con el trabajo en mi auto.",
}

describe("referenceSchema", () => {
  it("accepts a minimal valid reference and defaults order to 0 and published to true", () => {
    const result = referenceSchema.parse(base)
    expect(result.order).toBe(0)
    expect(result.published).toBe(true)
  })

  it("rejects a comment shorter than 10 characters", () => {
    expect(referenceSchema.safeParse({ ...base, comment: "corto" }).success).toBe(false)
  })

  it("rejects an author name shorter than 2 characters", () => {
    expect(referenceSchema.safeParse({ ...base, authorName: "M" }).success).toBe(false)
  })

  it("allows an empty imageUrl but rejects an invalid one", () => {
    expect(referenceSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(true)
    expect(referenceSchema.safeParse({ ...base, imageUrl: "no-es-url" }).success).toBe(false)
  })
})
