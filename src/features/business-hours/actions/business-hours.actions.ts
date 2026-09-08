"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-guards"
import {
  businessHoursExceptionSchema,
  businessHoursSchema,
  type BusinessHoursExceptionInput,
  type BusinessHoursInput,
} from "@/features/business-hours/schemas/business-hours.schema"
import {
  deleteBusinessHoursException,
  saveBusinessHours,
  saveBusinessHoursException,
} from "@/features/business-hours/services/business-hours.service"

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

export async function saveBusinessHoursExceptionAction(
  input: BusinessHoursExceptionInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = businessHoursExceptionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await saveBusinessHoursException(parsed.data)

  revalidatePath("/admin/horario")
  return { success: true }
}

export async function deleteBusinessHoursExceptionAction(date: string): Promise<ActionResult> {
  await requireRole("ADMIN")
  await deleteBusinessHoursException(date)

  revalidatePath("/admin/horario")
  return { success: true }
}
