"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import {
  referenceSchema,
  type ReferenceInput,
} from "@/features/references/schemas/reference.schema"
import {
  createReference,
  deleteReference,
  getReference,
  updateReference,
} from "@/features/references/services/reference.service"
import { deleteUploadThingFile } from "@/lib/uploadthing-server"

type ActionResult = { success: true } | { success: false; error: string }

export async function createReferenceAction(input: ReferenceInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = referenceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await createReference(parsed.data)

  revalidatePath("/admin/referencias")
  revalidatePath("/")
  redirect("/admin/referencias")
}

export async function updateReferenceAction(
  id: string,
  input: ReferenceInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = referenceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const previous = await getReference(id)
  await updateReference(id, parsed.data)

  if (previous?.imageUrl && previous.imageUrl !== parsed.data.imageUrl) {
    void deleteUploadThingFile(previous.imageUrl).catch((error) => {
      console.error("[referencias] No se pudo borrar la foto anterior de UploadThing:", error)
    })
  }

  revalidatePath("/admin/referencias")
  revalidatePath("/")
  redirect("/admin/referencias")
}

export async function deleteReferenceAction(id: string) {
  await requireRole("ADMIN")
  const deleted = await deleteReference(id)
  if (deleted.imageUrl) {
    void deleteUploadThingFile(deleted.imageUrl).catch((error) => {
      console.error("[referencias] No se pudo borrar la foto de UploadThing:", error)
    })
  }
  revalidatePath("/admin/referencias")
  revalidatePath("/")
}
