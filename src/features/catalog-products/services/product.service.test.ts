import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import { createProduct, listPublishedProducts } from "@/features/catalog-products/services/product.service"
import type { ProductInput } from "@/features/catalog-products/schemas/product.schema"

describe("listPublishedProducts", () => {
  it("only asks for published products", async () => {
    prismaMock.product.findMany.mockResolvedValue([] as never)

    await listPublishedProducts()

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } })
    )
  })
})

describe("createProduct", () => {
  it("stores an empty imageUrl as null", async () => {
    prismaMock.product.create.mockResolvedValue({} as never)

    const input: ProductInput = {
      name: "Filtro de aceite",
      slug: "filtro-de-aceite",
      description: "Filtro de aceite compatible con la mayoría de motores",
      price: 5990,
      imageUrl: "",
      stock: 10,
      published: true,
    }
    await createProduct(input)

    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageUrl: null }) })
    )
  })
})
