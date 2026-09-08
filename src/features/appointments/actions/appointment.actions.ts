"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/features/appointments/schemas/appointment.schema"
import {
  createAppointment,
  deleteAppointment,
  findSchedulingConflict,
  updateAppointment,
} from "@/features/appointments/services/appointment.service"

type ActionResult = { success: true } | { success: false; error: string }

const SLOT_TAKEN_MESSAGE = "Ya existe una cita agendada cerca de esa hora. Elige otro horario."

export async function createAppointmentAction(input: AppointmentInput): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const conflict = await findSchedulingConflict(new Date(parsed.data.scheduledAt))
  if (conflict) {
    return { success: false, error: SLOT_TAKEN_MESSAGE }
  }

  await createAppointment(parsed.data)
  revalidatePath("/colaborador/agenda")
  redirect("/colaborador/agenda")
}

export async function updateAppointmentAction(
  id: string,
  input: AppointmentInput
): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const conflict = await findSchedulingConflict(new Date(parsed.data.scheduledAt), id)
  if (conflict) {
    return { success: false, error: SLOT_TAKEN_MESSAGE }
  }

  await updateAppointment(id, parsed.data)
  revalidatePath("/colaborador/agenda")
  return { success: true }
}

export async function deleteAppointmentAction(id: string) {
  await requireRole("ADMIN", "COLLABORATOR")
  await deleteAppointment(id)
  revalidatePath("/colaborador/agenda")
  redirect("/colaborador/agenda")
}
