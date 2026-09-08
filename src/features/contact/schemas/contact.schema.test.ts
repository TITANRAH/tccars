import { describe, expect, it } from "vitest"
import { contactSchema } from "@/features/contact/schemas/contact.schema"

const base = {
  name: "Juan Pérez",
  email: "juan@correo.cl",
  phone: "+56912345678",
  message: "Necesito una mantención para mi auto",
  privacyAccepted: true,
}

describe("contactSchema", () => {
  it("accepts a valid contact message", () => {
    expect(contactSchema.safeParse(base).success).toBe(true)
  })

  it("rejects a message shorter than 10 characters", () => {
    expect(contactSchema.safeParse({ ...base, message: "hola" }).success).toBe(false)
  })

  it("requires a phone — needed to reach back on WhatsApp", () => {
    expect(contactSchema.safeParse({ ...base, phone: "" }).success).toBe(false)
  })

  it("requires accepting the privacy policy", () => {
    expect(contactSchema.safeParse({ ...base, privacyAccepted: false }).success).toBe(false)
  })
})
