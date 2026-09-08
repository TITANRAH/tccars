import { describe, expect, it } from "vitest"
import { contactSchema } from "@/features/contact/schemas/contact.schema"

describe("contactSchema", () => {
  it("accepts a valid contact message", () => {
    expect(
      contactSchema.safeParse({
        name: "Juan Pérez",
        email: "juan@correo.cl",
        message: "Necesito una mantención para mi auto",
      }).success
    ).toBe(true)
  })

  it("rejects a message shorter than 10 characters", () => {
    expect(
      contactSchema.safeParse({ name: "Juan", email: "juan@correo.cl", message: "hola" }).success
    ).toBe(false)
  })

  it("allows an empty phone", () => {
    expect(
      contactSchema.safeParse({
        name: "Juan",
        email: "juan@correo.cl",
        message: "Necesito cotizar un cambio de embrague",
        phone: "",
      }).success
    ).toBe(true)
  })
})
