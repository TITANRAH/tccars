import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export function listQuoteRequests() {
  return prisma.quoteRequest.findMany({
    include: { vehicle: true, responses: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function createQuoteRequest(params: {
  vehicleId?: string | null
  maintenanceId?: string | null
  requestedItems: Prisma.InputJsonValue
}) {
  return prisma.quoteRequest.create({
    data: {
      vehicleId: params.vehicleId ?? null,
      maintenanceId: params.maintenanceId ?? null,
      requestedItems: params.requestedItems,
    },
  })
}

export async function addQuoteResponse(params: {
  quoteRequestId: string
  supplierId: string
  amount: number
  notes?: string | null
}) {
  const [response] = await prisma.$transaction([
    prisma.quoteResponse.create({
      data: {
        quoteRequestId: params.quoteRequestId,
        supplierId: params.supplierId,
        amount: params.amount,
        notes: params.notes ?? null,
      },
    }),
    prisma.quoteRequest.update({
      where: { id: params.quoteRequestId },
      data: { status: "RESPONDIDA" },
    }),
  ])
  return response
}

export async function selectQuoteResponse(quoteRequestId: string, quoteResponseId: string) {
  await prisma.$transaction([
    prisma.quoteResponse.updateMany({
      where: { quoteRequestId },
      data: { selected: false },
    }),
    prisma.quoteResponse.update({
      where: { id: quoteResponseId },
      data: { selected: true },
    }),
    prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: "SELECCIONADA" },
    }),
  ])
}

export function findSupplierByEmail(email: string) {
  return prisma.supplier.findFirst({ where: { email: email.toLowerCase() } })
}
