import { beforeEach, vi } from "vitest"
import { mockReset } from "vitest-mock-extended"
import { prismaMock } from "@/lib/__mocks__/prisma"

// Todos los "services" importan `prisma` desde "@/lib/prisma" — reemplazamos
// ese módulo por el mock en todos los tests, así ningún test toca la base
// real de Neon.
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

beforeEach(() => {
  mockReset(prismaMock)
})
