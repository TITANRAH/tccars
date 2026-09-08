"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-guards"
import {
  businessHoursSchema,
  type BusinessHoursInput,
} from "@/features/business-hours/schemas/business-hours.schema"
import { saveBusinessHours } from "@/features/business-hours/services/business-hours.service"

type ActionResult = { success: true } | { success: false; error: string }

export async function saveBusinessHoursAction(input: BusinessHoursInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = businessHoursSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await saveBusinessHours(parsed.data)

  revalidatePath("/admin/horario")
  return { success: true }
}
