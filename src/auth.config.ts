import type { NextAuthConfig } from "next-auth"

/**
 * Config compartida entre el middleware (Edge runtime, sin Prisma) y el
 * auth.ts completo (Node runtime, con el provider de Credentials).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl

      const isProtected =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/colaborador") ||
        pathname.startsWith("/mi-cuenta")

      if (!isProtected) return true
      if (!isLoggedIn) return false

      const role = auth.user.role
      if (pathname.startsWith("/admin") && role !== "ADMIN") return false
      if (pathname.startsWith("/colaborador") && role !== "COLLABORATOR" && role !== "ADMIN")
        return false

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "ADMIN" | "COLLABORATOR" | "CLIENT"
      }
      return session
    },
  },
} satisfies NextAuthConfig
