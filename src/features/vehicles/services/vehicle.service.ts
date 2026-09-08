import { prisma } from "@/lib/prisma"
import type { VehicleInput } from "@/features/vehicles/schemas/vehicle.schema"

const CLIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const

const PAGE_SIZE = 20

export async function listVehicles(query?: string, page = 1) {
  const where = query ? { patente: { contains: query.toUpperCase() } } : {}

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { client: { select: CLIENT_SELECT } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
  ])
  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** Búsqueda liviana (sin paginar) para el picker de vehículo dentro de otros formularios (ej. agenda). */
export function searchVehiclesByPatente(query: string) {
  return prisma.vehicle.findMany({
    where: { patente: { contains: query.toUpperCase() } },
    include: { client: { select: CLIENT_SELECT } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}

export function getVehicle(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { client: { select: CLIENT_SELECT } },
  })
}

export function getVehicleByPatente(patente: string) {
  return prisma.vehicle.findUnique({
    where: { patente },
    include: { client: { select: CLIENT_SELECT } },
  })
}

export function listVehiclesForClient(clientId: string) {
  return prisma.vehicle.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } })
}

export function createVehicle(data: VehicleInput) {
  return prisma.vehicle.create({ data: { ...data, color: data.color || null } })
}

export function updateVehicle(id: string, data: VehicleInput) {
  return prisma.vehicle.update({ where: { id }, data: { ...data, color: data.color || null } })
}

export function deleteVehicle(id: string) {
  return prisma.vehicle.delete({ where: { id } })
}

/** Búsqueda liviana (sin paginar) para el picker de cliente dentro de "Registrar vehículo". */
export function searchClients(query: string) {
  return prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: CLIENT_SELECT,
    orderBy: { firstName: "asc" },
    take: 10,
  })
}

export async function listClients(query?: string, page = 1) {
  const where = {
    role: "CLIENT" as const,
    ...(query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: CLIENT_SELECT,
      orderBy: { firstName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}
