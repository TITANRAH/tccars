"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import {
  vehicleSchema,
  newClientSchema,
  type VehicleInput,
  type NewClientInput,
} from "@/features/vehicles/schemas/vehicle.schema"
import {
  createVehicle,
  deleteVehicle,
  searchClients,
  searchVehiclesByPatente,
  updateVehicle,
} from "@/features/vehicles/services/vehicle.service"
import { findUserByEmail } from "@/features/auth/services/auth.service"
import { sendEmail } from "@/lib/email/resend"
import { ResetPasswordEmail } from "@/lib/email/templates/reset-password-email"
import { fullName } from "@/lib/user-display"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWith<T> = { success: true; data: T } | { success: false; error: string }

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}

export async function searchClientsAction(query: string) {
  await requireRole("ADMIN", "COLLABORATOR")
  if (query.trim().length < 2) return []
  return searchClients(query.trim())
}

export async function searchVehiclesAction(query: string) {
  await requireRole("ADMIN", "COLLABORATOR")
  if (query.trim().length < 2) return []
  return searchVehiclesByPatente(query.trim())
}

export async function createClientAction(
  input: NewClientInput
): Promise<ActionResultWith<{ id: string; name: string; email: string }>> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = newClientSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const existing = await findUserByEmail(parsed.data.email)
  if (existing) {
    return { success: false, error: "Ya existe un usuario con ese correo" }
  }

  const tempPassword = randomBytes(16).toString("hex")
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const client = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "CLIENT",
      emailVerified: new Date(),
    },
  })

  const resetToken = randomBytes(32).toString("hex")
  await prisma.passwordResetToken.create({
    data: {
      email: client.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const resetUrl = `${siteUrl}/restablecer-contrasena?token=${resetToken}`
  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev] Enlace para que ${client.email} cree su contraseña: ${resetUrl}`)
  }
  // El cliente ya quedó creado en la base aunque este correo falle (ej.
  // límite del sandbox de Resend) — no hay que hacer fallar la acción por
  // eso, el enlace ya quedó impreso arriba para pasarlo a mano si hace falta.
  try {
    await sendEmail({
      to: client.email,
      subject: "Bienvenido a TC Cars — crea tu contraseña",
      react: ResetPasswordEmail({ resetUrl }),
    })
  } catch (error) {
    console.error("[vehiculos] No se pudo enviar el correo de invitación al cliente:", error)
  }

  return {
    success: true,
    data: { id: client.id, name: fullName(client), email: client.email },
  }
}

export async function createVehicleAction(input: VehicleInput): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await createVehicle(parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un vehículo con esa patente" }
    }
    return { success: false, error: "No se pudo registrar el vehículo" }
  }

  revalidatePath("/colaborador/vehiculos")
  redirect("/colaborador/vehiculos")
}

export async function updateVehicleAction(
  id: string,
  input: VehicleInput
): Promise<ActionResult> {
  await requireRole("ADMIN", "COLLABORATOR")
  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await updateVehicle(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un vehículo con esa patente" }
    }
    return { success: false, error: "No se pudo actualizar el vehículo" }
  }

  revalidatePath("/colaborador/vehiculos")
  redirect("/colaborador/vehiculos")
}

export async function deleteVehicleAction(id: string) {
  await requireRole("ADMIN")
  await deleteVehicle(id)
  revalidatePath("/colaborador/vehiculos")
}
