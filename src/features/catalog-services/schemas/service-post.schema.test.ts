import { describe, expect, it } from "vitest"
import { servicePostSchema } from "@/features/catalog-services/schemas/service-post.schema"

const base = {
  title: "Afinamiento",
  slug: "afinamiento",
  description: "Revisión y ajuste completo del motor",
}

describe("servicePostSchema", () => {
  it("accepts a valid service post and defaults order to 0, published and featured", () => {
    const result = servicePostSchema.parse(base)
    expect(result.order).toBe(0)
    expect(result.published).toBe(true)
    expect(result.featured).toBe(false)
  })

  it("rejects a slug with invalid characters", () => {
    expect(servicePostSchema.safeParse({ ...base, slug: "afinamiento_motor!" }).success).toBe(false)
  })

  it("rejects a description shorter than 10 characters", () => {
    expect(servicePostSchema.safeParse({ ...base, description: "corto" }).success).toBe(false)
  })
})
