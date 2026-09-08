"use server"

import { AuthError as NextAuthError } from "next-auth"
import { signIn } from "@/auth"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/features/auth/schemas/auth.schema"
import {
  AuthError,
  findUserByEmail,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
} from "@/features/auth/services/auth.service"
import { sendEmail } from "@/lib/email/resend"
import { fullName } from "@/lib/user-display"
import { VerifyEmail } from "@/lib/email/templates/verify-email"
import { ResetPasswordEmail } from "@/lib/email/templates/reset-password-email"

type ActionResult = { success: true; message?: string } | { success: false; error: string }

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const existingUser = await findUserByEmail(parsed.data.email)
  const redirectTo =
    existingUser?.role === "ADMIN"
      ? "/admin"
      : existingUser?.role === "COLLABORATOR"
        ? "/colaborador"
        : "/mi-cuenta"

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof NextAuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "Correo o contraseña incorrectos" }
      }
      const cause = error.cause as { err?: Error } | undefined
      return {
        success: false,
        error: cause?.err?.message ?? "No se pudo iniciar sesión",
      }
    }
    throw error
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const { user, verificationToken } = await registerUser(parsed.data)
    const verifyUrl = `${siteUrl()}/verificar-correo?token=${verificationToken}`
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Enlace de verificación para ${user.email}: ${verifyUrl}`)
    }

    // A diferencia de las invitaciones que manda el ADMIN (donde el enlace
    // queda accesible por consola/base de datos), aquí quien se registra no
    // tiene otra forma de conseguir el enlace si el correo falla — la cuenta
    // ya quedó creada, pero avisamos con honestidad en vez de decir "revisa
    // tu correo" sabiendo que nunca va a llegar.
    try {
      await sendEmail({
        to: user.email,
        subject: "Confirma tu cuenta en TC Cars",
        react: VerifyEmail({ name: fullName(user), verifyUrl }),
      })
    } catch (error) {
      console.error("[registro] No se pudo enviar el correo de verificación:", error)
      return {
        success: true,
        message:
          "Tu cuenta fue creada, pero no pudimos enviarte el correo de confirmación. Contáctanos para activarla.",
      }
    }

    return {
      success: true,
      message: "Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.",
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "No se pudo crear la cuenta. Intenta nuevamente." }
  }
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  try {
    await verifyEmailToken(token)
    return { success: true, message: "Tu correo fue confirmado. Ya puedes iniciar sesión." }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "No se pudo verificar el correo." }
  }
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const token = await requestPasswordReset(parsed.data.email)

  if (token) {
    const resetUrl = `${siteUrl()}/restablecer-contrasena?token=${token}`
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Enlace para restablecer contraseña de ${parsed.data.email}: ${resetUrl}`)
    }

    // Si el envío falla, igual respondemos el mensaje genérico de abajo — así
    // no delatamos por un error distinto que el correo sí existe en el sistema.
    try {
      await sendEmail({
        to: parsed.data.email,
        subject: "Restablece tu contraseña — TC Cars",
        react: ResetPasswordEmail({ resetUrl }),
      })
    } catch (error) {
      console.error("[recuperar-password] No se pudo enviar el correo:", error)
    }
  }

  // Mensaje genérico siempre, exista o no la cuenta.
  return {
    success: true,
    message: "Si el correo existe, te enviamos instrucciones para restablecer tu contraseña.",
  }
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password)
    return { success: true, message: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "No se pudo restablecer la contraseña." }
  }
}
