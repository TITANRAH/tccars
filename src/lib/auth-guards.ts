import { redirect } from "next/navigation"
import { auth } from "@/auth"

export async function requireSession() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}

export async function requireRole(...roles: Array<"ADMIN" | "COLLABORATOR" | "CLIENT">) {
  const session = await requireSession()
  if (!roles.includes(session.user.role)) redirect("/")
  return session
}
