"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import {
  servicePostSchema,
  type ServicePostInput,
} from "@/features/catalog-services/schemas/service-post.schema"
import {
  createServicePost,
  deleteServicePost,
  getServicePost,
  updateServicePost,
} from "@/features/catalog-services/services/service-post.service"
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

export async function createServicePostAction(input: ServicePostInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = servicePostSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await createServicePost(parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe una publicación con ese slug" }
    }
    return { success: false, error: "No se pudo crear la publicación" }
  }

  revalidatePath("/admin/servicios")
  revalidatePath("/servicios")
  redirect("/admin/servicios")
}

export async function updateServicePostAction(
  id: string,
  input: ServicePostInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = servicePostSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const previous = await getServicePost(id)
  try {
    await updateServicePost(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe una publicación con ese slug" }
    }
    return { success: false, error: "No se pudo actualizar la publicación" }
  }

  if (previous?.imageUrl && previous.imageUrl !== parsed.data.imageUrl) {
    void deleteUploadThingFile(previous.imageUrl).catch((error) => {
      console.error("[servicios] No se pudo borrar la foto anterior de UploadThing:", error)
    })
  }

  revalidatePath("/admin/servicios")
  revalidatePath("/servicios")
  redirect("/admin/servicios")
}

export async function deleteServicePostAction(id: string) {
  await requireRole("ADMIN")
  const deleted = await deleteServicePost(id)
  if (deleted.imageUrl) {
    void deleteUploadThingFile(deleted.imageUrl).catch((error) => {
      console.error("[servicios] No se pudo borrar la foto de UploadThing:", error)
    })
  }
  revalidatePath("/admin/servicios")
  revalidatePath("/servicios")
}
