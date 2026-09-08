import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  addQuoteResponse,
  findSupplierByEmail,
  selectQuoteResponse,
} from "@/features/quotes/services/quote.service"

describe("addQuoteResponse", () => {
  it("creates the response and marks the request as RESPONDIDA in the same transaction", async () => {
    prismaMock.quoteResponse.create.mockResolvedValue({ id: "resp-1" } as never)
    prismaMock.quoteRequest.update.mockResolvedValue({} as never)

    const result = await addQuoteResponse({
      quoteRequestId: "req-1",
      supplierId: "sup-1",
      amount: 45000,
    })

    expect(result).toEqual({ id: "resp-1" })
    expect(prismaMock.quoteResponse.create).toHaveBeenCalledWith({
      data: { quoteRequestId: "req-1", supplierId: "sup-1", amount: 45000, notes: null },
    })
    expect(prismaMock.quoteRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "RESPONDIDA" },
    })
  })
})

describe("selectQuoteResponse", () => {
  it("unselects every other response before selecting the chosen one", async () => {
    prismaMock.quoteResponse.updateMany.mockResolvedValue({ count: 2 } as never)
    prismaMock.quoteResponse.update.mockResolvedValue({} as never)
    prismaMock.quoteRequest.update.mockResolvedValue({} as never)

    await selectQuoteResponse("req-1", "resp-2")

    expect(prismaMock.quoteResponse.updateMany).toHaveBeenCalledWith({
      where: { quoteRequestId: "req-1" },
      data: { selected: false },
    })
    expect(prismaMock.quoteResponse.update).toHaveBeenCalledWith({
      where: { id: "resp-2" },
      data: { selected: true },
    })
    expect(prismaMock.quoteRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "SELECCIONADA" },
    })
  })
})

describe("findSupplierByEmail", () => {
  it("lowercases the email before searching", async () => {
    prismaMock.supplier.findFirst.mockResolvedValue(null)

    await findSupplierByEmail("Proveedor@Ejemplo.CL")

    expect(prismaMock.supplier.findFirst).toHaveBeenCalledWith({
      where: { email: "proveedor@ejemplo.cl" },
    })
  })
})
