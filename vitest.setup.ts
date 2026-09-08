import { beforeEach, vi } from "vitest"
import { mockReset } from "vitest-mock-extended"
import { prismaMock } from "@/lib/__mocks__/prisma"

// Todos los "services" importan `prisma` desde "@/lib/prisma" — reemplazamos
// ese módulo por el mock en todos los tests, así ningún test toca la base
// real de Neon.
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

beforeEach(() => {
  mockReset(prismaMock)
  // Prisma real, en su forma de array ($transaction([...])), simplemente
  // ejecuta cada query y devuelve sus resultados — replicamos eso para que
  // los services que usan transacciones no necesiten mockear esto a mano.
  prismaMock.$transaction.mockImplementation((arg) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock)
  )
})
