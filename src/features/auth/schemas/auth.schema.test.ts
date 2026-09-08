import { describe, expect, it } from "vitest"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas/auth.schema"

describe("loginSchema", () => {
  it("lowercases and trims the email", () => {
    expect(loginSchema.parse({ email: " Test@Correo.CL ", password: "x" }).email).toBe(
      "test@correo.cl"
    )
  })

  it("requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.cl", password: "" }).success).toBe(false)
  })
})

describe("registerSchema", () => {
  const base = {
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@correo.cl",
    password: "12345678",
    confirmPassword: "12345678",
    privacyAccepted: true,
  }

  it("accepts matching passwords of at least 8 characters", () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })

  it("rejects when password and confirmPassword don't match", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"])
    }
  })

  it("rejects a password shorter than 8 characters", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "1234567", confirmPassword: "1234567" }).success
    ).toBe(false)
  })

  it("allows an empty phone but rejects a too-short one", () => {
    expect(registerSchema.safeParse({ ...base, phone: "" }).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, phone: "123" }).success).toBe(false)
  })

  it("requires accepting the privacy policy", () => {
    expect(registerSchema.safeParse({ ...base, privacyAccepted: false }).success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "no-es-un-correo" }).success).toBe(false)
    expect(forgotPasswordSchema.safeParse({ email: "si@correo.cl" }).success).toBe(true)
  })
})

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc",
      password: "12345678",
      confirmPassword: "87654321",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a matching pair", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "abc",
        password: "12345678",
        confirmPassword: "12345678",
      }).success
    ).toBe(true)
  })
})
