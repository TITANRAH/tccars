"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { productSchema, type ProductInput } from "@/features/catalog-products/schemas/product.schema"
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/features/catalog-products/services/product.service"

type ActionResult = { success: true } | { success: false; error: string }

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await createProduct(parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un producto con ese slug" }
    }
    return { success: false, error: "No se pudo crear el producto" }
  }

  revalidatePath("/admin/productos")
  revalidatePath("/productos")
  redirect("/admin/productos")
}

export async function updateProductAction(
  id: string,
  input: ProductInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await updateProduct(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un producto con ese slug" }
    }
    return { success: false, error: "No se pudo actualizar el producto" }
  }

  revalidatePath("/admin/productos")
  revalidatePath("/productos")
  redirect("/admin/productos")
}

export async function deleteProductAction(id: string) {
  await requireRole("ADMIN")
  await deleteProduct(id)
  revalidatePath("/admin/productos")
  revalidatePath("/productos")
}
