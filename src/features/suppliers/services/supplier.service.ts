import { prisma } from "@/lib/prisma"
import type { SupplierInput } from "@/features/suppliers/schemas/supplier.schema"

export function listSuppliers() {
  return prisma.supplier.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] })
}

export function listActiveSuppliers() {
  return prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } })
}

export function getSupplier(id: string) {
  return prisma.supplier.findUnique({ where: { id } })
}

export function createSupplier(data: SupplierInput) {
  return prisma.supplier.create({ data: { ...data, specialty: data.specialty || null, phone: data.phone || null } })
}

export function updateSupplier(id: string, data: SupplierInput) {
  return prisma.supplier.update({
    where: { id },
    data: { ...data, specialty: data.specialty || null, phone: data.phone || null },
  })
}

export function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } })
}
