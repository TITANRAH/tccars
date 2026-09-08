import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  createServicePost,
  updateServicePost,
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
      featured: false,
    }
    await createServicePost(input)

    expect(prismaMock.servicePost.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageUrl: null }) })
    )
  })

  it("unsets featured on every other service before creating a new featured one", async () => {
    prismaMock.servicePost.updateMany.mockResolvedValue({ count: 1 } as never)
    prismaMock.servicePost.create.mockResolvedValue({} as never)

    const input: ServicePostInput = {
      title: "Mantenciones",
      slug: "mantenciones",
      description: "Mantención preventiva y correctiva",
      imageUrl: "",
      order: 0,
      published: true,
      featured: true,
    }
    await createServicePost(input)

    expect(prismaMock.servicePost.updateMany).toHaveBeenCalledWith({
      where: { featured: true },
      data: { featured: false },
    })
    expect(prismaMock.servicePost.create).toHaveBeenCalled()
  })
})

describe("updateServicePost", () => {
  it("unsets featured on every other service (excluding itself) when marking one as featured", async () => {
    prismaMock.servicePost.updateMany.mockResolvedValue({ count: 1 } as never)
    prismaMock.servicePost.update.mockResolvedValue({} as never)

    const input: ServicePostInput = {
      title: "Mantenciones",
      slug: "mantenciones",
      description: "Mantención preventiva y correctiva",
      imageUrl: "",
      order: 0,
      published: true,
      featured: true,
    }
    await updateServicePost("svc-1", input)

    expect(prismaMock.servicePost.updateMany).toHaveBeenCalledWith({
      where: { featured: true, NOT: { id: "svc-1" } },
      data: { featured: false },
    })
    expect(prismaMock.servicePost.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "svc-1" } })
    )
  })

  it("does not touch other services when not marking as featured", async () => {
    prismaMock.servicePost.update.mockResolvedValue({} as never)

    const input: ServicePostInput = {
      title: "Afinamiento",
      slug: "afinamiento",
      description: "Revisión y ajuste completo del motor",
      imageUrl: "",
      order: 0,
      published: true,
      featured: false,
    }
    await updateServicePost("svc-2", input)

    expect(prismaMock.servicePost.updateMany).not.toHaveBeenCalled()
    expect(prismaMock.servicePost.update).toHaveBeenCalled()
  })
})
