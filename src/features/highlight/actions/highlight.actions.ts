"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-guards"
import {
  highlightSchema,
  type HighlightInput,
} from "@/features/highlight/schemas/highlight.schema"
import {
  createHighlight,
  deleteHighlight,
  getHighlight,
  updateHighlight,
} from "@/features/highlight/services/highlight.service"
import { deleteUploadThingFile } from "@/lib/uploadthing-server"

type ActionResult = { success: true } | { success: false; error: string }

export async function saveHighlightAction(
  id: string | null,
  input: HighlightInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = highlightSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  if (id) {
    const previous = await getHighlight(id)
    await updateHighlight(id, parsed.data)
    if (previous?.imageUrl && previous.imageUrl !== parsed.data.imageUrl) {
      void deleteUploadThingFile(previous.imageUrl).catch((error) => {
        console.error("[destacado] No se pudo borrar la foto anterior de UploadThing:", error)
      })
    }
  } else {
    await createHighlight(parsed.data)
  }

  revalidatePath("/")
  revalidatePath("/admin/destacado")
  return { success: true }
}

export async function deleteHighlightAction(id: string) {
  await requireRole("ADMIN")
  const deleted = await deleteHighlight(id)
  if (deleted.imageUrl) {
    void deleteUploadThingFile(deleted.imageUrl).catch((error) => {
      console.error("[destacado] No se pudo borrar la foto de UploadThing:", error)
    })
  }
  revalidatePath("/")
  revalidatePath("/admin/destacado")
}
