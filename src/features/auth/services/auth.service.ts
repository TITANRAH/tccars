import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { RegisterInput } from "@/features/auth/schemas/auth.schema"

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 // 24h
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30 // 30min

export class AuthError extends Error {}

function generateToken() {
  return randomBytes(32).toString("hex")
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } })
}

export async function verifyPassword(plainPassword: string, passwordHash: string) {
  return bcrypt.compare(plainPassword, passwordHash)
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase()
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new AuthError("Ya existe una cuenta con ese correo")
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      phone: input.phone || null,
      passwordHash,
      role: "CLIENT",
    },
  })

  const token = generateToken()
  await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  })

  return { user, verificationToken: token }
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    throw new AuthError("El enlace de verificación es inválido o expiró")
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ])

  return record.email
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase()
  const user = await findUserByEmail(normalizedEmail)
  // No revelamos si el correo existe o no (evita enumeración de usuarios).
  if (!user) return null

  const token = generateToken()
  await prisma.passwordResetToken.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  })

  return token
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    throw new AuthError("El enlace para restablecer la contraseña es inválido o expiró")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
  ])
}
