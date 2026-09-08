import { describe, expect, it } from "vitest"
import { prismaMock } from "@/lib/__mocks__/prisma"
import {
  AuthError,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
} from "@/features/auth/services/auth.service"
import type { RegisterInput } from "@/features/auth/schemas/auth.schema"

const registerInput: RegisterInput = {
  firstName: "Juan",
  lastName: "Pérez",
  email: "Juan@Correo.CL",
  password: "12345678",
  confirmPassword: "12345678",
}

describe("registerUser", () => {
  it("throws AuthError when the email is already registered", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" } as never)

    await expect(registerUser(registerInput)).rejects.toThrow(AuthError)
  })

  it("stores the email lowercased and creates a verification token", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: "u1", email: "juan@correo.cl" } as never)
    prismaMock.emailVerificationToken.create.mockResolvedValue({} as never)

    const result = await registerUser(registerInput)

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "juan@correo.cl" }) })
    )
    expect(result.verificationToken).toEqual(expect.any(String))
  })
})

describe("verifyEmailToken", () => {
  it("throws AuthError when the token doesn't exist", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue(null)
    await expect(verifyEmailToken("nope")).rejects.toThrow(AuthError)
  })

  it("throws AuthError when the token already expired", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      email: "a@b.cl",
      token: "t1",
      expiresAt: new Date(Date.now() - 1000),
    } as never)
    await expect(verifyEmailToken("t1")).rejects.toThrow(AuthError)
  })

  it("marks the user verified and deletes the token when valid", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      email: "a@b.cl",
      token: "t1",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    } as never)
    prismaMock.user.update.mockResolvedValue({} as never)
    prismaMock.emailVerificationToken.delete.mockResolvedValue({} as never)

    const email = await verifyEmailToken("t1")

    expect(email).toBe("a@b.cl")
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "a@b.cl" },
      data: { emailVerified: expect.any(Date) },
    })
  })
})

describe("requestPasswordReset", () => {
  it("returns null without creating a token when the email doesn't exist (no enumeration)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const token = await requestPasswordReset("nadie@correo.cl")

    expect(token).toBeNull()
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it("creates a reset token when the email exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.cl" } as never)
    prismaMock.passwordResetToken.create.mockResolvedValue({} as never)

    const token = await requestPasswordReset("A@B.cl")

    expect(token).toEqual(expect.any(String))
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "a@b.cl" }) })
    )
  })
})

describe("resetPassword", () => {
  it("throws AuthError when the token is invalid or expired", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null)
    await expect(resetPassword("bad-token", "newpass123")).rejects.toThrow(AuthError)
  })

  it("hashes the new password and removes every reset token for that email", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      email: "a@b.cl",
      token: "t1",
      expiresAt: new Date(Date.now() + 1000 * 60),
    } as never)
    prismaMock.user.update.mockResolvedValue({} as never)
    prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 } as never)

    await resetPassword("t1", "newpass123")

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "a@b.cl" } })
    )
    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email: "a@b.cl" },
    })
  })
})
