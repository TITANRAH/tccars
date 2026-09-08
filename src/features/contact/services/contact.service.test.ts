import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import { saveContactMessage } from "@/features/contact/services/contact.service"
import type { ContactInput } from "@/features/contact/schemas/contact.schema"

describe("saveContactMessage", () => {
  it("stores an empty phone as null", async () => {
    prismaMock.contactMessage.create.mockResolvedValue({} as never)

    const input: ContactInput = {
      name: "Juan Pérez",
      email: "juan@correo.cl",
      message: "Necesito cotizar un cambio de embrague",
      phone: "",
      privacyAccepted: true,
    }
    await saveContactMessage(input)

    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ phone: null }),
    })
  })
})
