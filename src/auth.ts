import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/auth.config"
import { loginSchema } from "@/features/auth/schemas/auth.schema"
import { findUserByEmail, verifyPassword } from "@/features/auth/services/auth.service"
import { fullName } from "@/lib/user-display"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await findUserByEmail(parsed.data.email)
        if (!user) return null

        if (!user.emailVerified) {
          throw new Error("Debes confirmar tu correo antes de iniciar sesión")
        }

        if (!user.active) {
          throw new Error("Tu cuenta está deshabilitada. Contacta al taller.")
        }

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: fullName(user),
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
})
