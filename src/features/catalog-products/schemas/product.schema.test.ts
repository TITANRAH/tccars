import { describe, expect, it } from "vitest"
import { productSchema } from "@/features/catalog-products/schemas/product.schema"

const base = {
  name: "Filtro de aceite",
  slug: "filtro-de-aceite",
  description: "Filtro de aceite compatible con la mayoría de motores",
  price: 5990,
}

describe("productSchema", () => {
  it("accepts a valid product and defaults stock to 0 and published to true", () => {
    const result = productSchema.parse(base)
    expect(result.stock).toBe(0)
    expect(result.published).toBe(true)
  })

  it("rejects a slug with uppercase letters or spaces", () => {
    expect(productSchema.safeParse({ ...base, slug: "Filtro De Aceite" }).success).toBe(false)
  })

  it("rejects a negative price or stock", () => {
    expect(productSchema.safeParse({ ...base, price: -100 }).success).toBe(false)
    expect(productSchema.safeParse({ ...base, stock: -1 }).success).toBe(false)
  })

  it("allows an empty imageUrl but rejects an invalid one", () => {
    expect(productSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(true)
    expect(productSchema.safeParse({ ...base, imageUrl: "no-es-una-url" }).success).toBe(false)
  })
})
