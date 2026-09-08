"use server"

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"
import {
  collaboratorSchema,
  type CollaboratorInput,
} from "@/features/collaborators/schemas/collaborator.schema"
import {
  createCollaboratorProfile,
  setCollaboratorActive,
  updateCollaborator,
} from "@/features/collaborators/services/collaborator.service"
import { findUserByEmail } from "@/features/auth/services/auth.service"
import { sendEmail } from "@/lib/email/resend"
import { ResetPasswordEmail } from "@/lib/email/templates/reset-password-email"

type ActionResult = { success: true } | { success: false; error: string }

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}

export async function createCollaboratorAction(input: CollaboratorInput): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = collaboratorSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const existing = await findUserByEmail(parsed.data.email)
  if (existing) {
    return { success: false, error: "Ya existe un usuario con ese correo" }
  }

  const tempPassword = randomBytes(16).toString("hex")
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  let collaborator
  try {
    collaborator = await createCollaboratorProfile(parsed.data, passwordHash)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ese RUT o correo ya está registrado" }
    }
    return { success: false, error: "No se pudo crear el colaborador" }
  }

  const resetToken = randomBytes(32).toString("hex")
  await prisma.passwordResetToken.create({
    data: {
      email: collaborator.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const resetUrl = `${siteUrl}/restablecer-contrasena?token=${resetToken}`
  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev] Enlace para que ${collaborator.email} cree su contraseña: ${resetUrl}`)
  }
  // El colaborador ya quedó creado en la base aunque este correo falle (ej.
  // límite del sandbox de Resend) — no hay que hacer fallar la acción por
  // eso, el enlace ya quedó impreso arriba para pasarlo a mano si hace falta.
  try {
    await sendEmail({
      to: collaborator.email,
      subject: "Bienvenido a TC Cars — crea tu contraseña",
      react: ResetPasswordEmail({ resetUrl }),
    })
  } catch (error) {
    console.error("[colaboradores] No se pudo enviar el correo de invitación:", error)
  }

  revalidatePath("/admin/colaboradores")
  redirect("/admin/colaboradores")
}

export async function updateCollaboratorAction(
  id: string,
  input: CollaboratorInput
): Promise<ActionResult> {
  await requireRole("ADMIN")
  const parsed = collaboratorSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await updateCollaborator(id, parsed.data)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ese RUT ya está registrado" }
    }
    return { success: false, error: "No se pudo actualizar el colaborador" }
  }

  revalidatePath("/admin/colaboradores")
  redirect("/admin/colaboradores")
}

export async function toggleCollaboratorActiveAction(id: string, active: boolean) {
  await requireRole("ADMIN")
  await setCollaboratorActive(id, active)
  revalidatePath("/admin/colaboradores")
}
