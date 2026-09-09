"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { productSchema, type ProductInput } from "@/features/catalog-products/schemas/product.schema"
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/features/catalog-products/services/product.service"
import { deleteUploadThingFile } from "@/lib/uploadthing-server"

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

  const previous = await getProduct(id)
  try {
    await updateProduct(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un producto con ese slug" }
    }
    return { success: false, error: "No se pudo actualizar el producto" }
  }

  if (previous?.imageUrl && previous.imageUrl !== parsed.data.imageUrl) {
    void deleteUploadThingFile(previous.imageUrl).catch((error) => {
      console.error("[productos] No se pudo borrar la foto anterior de UploadThing:", error)
    })
  }

  revalidatePath("/admin/productos")
  revalidatePath("/productos")
  redirect("/admin/productos")
}

export async function deleteProductAction(id: string) {
  await requireRole("ADMIN")
  const deleted = await deleteProduct(id)
  if (deleted.imageUrl) {
    void deleteUploadThingFile(deleted.imageUrl).catch((error) => {
      console.error("[productos] No se pudo borrar la foto de UploadThing:", error)
    })
  }
  revalidatePath("/admin/productos")
  revalidatePath("/productos")
}
