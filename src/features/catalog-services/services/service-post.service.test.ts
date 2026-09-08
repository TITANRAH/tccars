import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createServicePost,
  listPublishedServicePosts,
} from "@/features/catalog-services/services/service-post.service"
import type { ServicePostInput } from "@/features/catalog-services/schemas/service-post.schema"

describe("listPublishedServicePosts", () => {
  it("only asks for published posts, ordered by 'order' then most recent", async () => {
    prismaMock.servicePost.findMany.mockResolvedValue([] as never)

    await listPublishedServicePosts()

    expect(prismaMock.servicePost.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })
  })
})

describe("createServicePost", () => {
  it("stores an empty imageUrl as null", async () => {
    prismaMock.servicePost.create.mockResolvedValue({} as never)

    const input: ServicePostInput = {
      title: "Afinamiento",
      slug: "afinamiento",
      description: "Revisión y ajuste completo del motor",
      imageUrl: "",
      order: 0,
      published: true,
    }
    await createServicePost(input)

    expect(prismaMock.servicePost.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageUrl: null }) })
    )
  })
})
