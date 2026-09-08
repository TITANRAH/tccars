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
  updateReference,
} from "@/features/references/services/reference.service"

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

  await updateReference(id, parsed.data)

  revalidatePath("/admin/referencias")
  revalidatePath("/")
  redirect("/admin/referencias")
}

export async function deleteReferenceAction(id: string) {
  await requireRole("ADMIN")
  await deleteReference(id)
  revalidatePath("/admin/referencias")
  revalidatePath("/")
}
