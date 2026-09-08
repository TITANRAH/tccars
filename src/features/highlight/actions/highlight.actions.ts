"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-guards"
import {
  highlightSchema,
  type HighlightInput,
} from "@/features/highlight/schemas/highlight.schema"
import { createHighlight, updateHighlight } from "@/features/highlight/services/highlight.service"

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
    await updateHighlight(id, parsed.data)
  } else {
    await createHighlight(parsed.data)
  }

  revalidatePath("/")
  revalidatePath("/admin/destacado")
  return { success: true }
}
