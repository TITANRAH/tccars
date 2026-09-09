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
      // /admin/clientes es la única sección de /admin que un COLLABORATOR
      // también puede usar (necesita buscar/crear clientes al registrar un
      // vehículo) — su propia página ya hace requireRole("ADMIN",
      // "COLLABORATOR"); el resto de /admin sigue siendo solo ADMIN.
      const isSharedAdminPage = pathname.startsWith("/admin/clientes")
      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        if (isSharedAdminPage && role === "COLLABORATOR") return true
        return false
      }
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
