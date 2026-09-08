import { describe, expect, it } from "vitest"
import { slugify } from "@/lib/slugify"

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Cambio de Aceite")).toBe("cambio-de-aceite")
  })

  it("strips accents", () => {
    expect(slugify("Afinamiento y Mantención")).toBe("afinamiento-y-mantencion")
  })

  it("collapses non-alphanumeric runs into a single dash", () => {
    expect(slugify("Scanner!! (diagnóstico)")).toBe("scanner-diagnostico")
  })

  it("trims leading and trailing dashes", () => {
    expect(slugify("  Embragues  ")).toBe("embragues")
  })
})
