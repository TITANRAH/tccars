import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createProduct,
  listProducts,
  listPublishedProducts,
} from "@/features/catalog-products/services/product.service"
import type { ProductInput } from "@/features/catalog-products/schemas/product.schema"

describe("listProducts", () => {
  it("paginates with a fixed page size of 20", async () => {
    prismaMock.product.findMany.mockResolvedValue([] as never)
    prismaMock.product.count.mockResolvedValue(41)

    const result = await listProducts(undefined, 2)

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    )
    expect(result.totalPages).toBe(3)
  })

  it("filters by name (case-insensitive) when a query is given", async () => {
    prismaMock.product.findMany.mockResolvedValue([] as never)
    prismaMock.product.count.mockResolvedValue(0)

    await listProducts("filtro")

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: "filtro", mode: "insensitive" } },
      })
    )
  })
})

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
