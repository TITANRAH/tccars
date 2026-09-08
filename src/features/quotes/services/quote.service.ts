import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const PAGE_SIZE = 20

export async function listQuoteRequests(query?: string, page = 1) {
  const where = query
    ? { vehicle: { patente: { contains: query.toUpperCase() } } }
    : {}

  const [items, total] = await Promise.all([
    prisma.quoteRequest.findMany({
      where,
      include: { vehicle: true, responses: { include: { supplier: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.quoteRequest.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
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
