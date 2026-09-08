"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import {
  supplierSchema,
  type SupplierInput,
} from "@/features/suppliers/schemas/supplier.schema"
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/features/suppliers/services/supplier.service"

type ActionResult = { success: true } | { success: false; error: string }

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}

export async function createSupplierAction(input: SupplierInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await createSupplier(parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un proveedor con ese correo" }
    }
    return { success: false, error: "No se pudo crear el proveedor" }
  }

  revalidatePath("/admin/proveedores")
  redirect("/admin/proveedores")
}

export async function updateSupplierAction(
  id: string,
  input: SupplierInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await updateSupplier(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un proveedor con ese correo" }
    }
    return { success: false, error: "No se pudo actualizar el proveedor" }
  }

  revalidatePath("/admin/proveedores")
  redirect("/admin/proveedores")
}

export async function deleteSupplierAction(id: string) {
  await requireRole("ADMIN")
  await deleteSupplier(id)
  revalidatePath("/admin/proveedores")
}
