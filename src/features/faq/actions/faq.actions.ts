"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { faqSchema, type FaqInput } from "@/features/faq/schemas/faq.schema"
import { createFaq, deleteFaq, updateFaq } from "@/features/faq/services/faq.service"

type ActionResult = { success: true } | { success: false; error: string }

export async function createFaqAction(input: FaqInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = faqSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await createFaq(parsed.data)

  revalidatePath("/admin/faq")
  redirect("/admin/faq")
}

export async function updateFaqAction(id: string, input: FaqInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = faqSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await updateFaq(id, parsed.data)

  revalidatePath("/admin/faq")
  redirect("/admin/faq")
}

export async function deleteFaqAction(id: string) {
  await requireRole("ADMIN")
  await deleteFaq(id)
  revalidatePath("/admin/faq")
}
