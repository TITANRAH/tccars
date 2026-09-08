import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { verifyEmailAction } from "@/features/auth/actions/auth.actions"

export const metadata = { title: "Verificar correo — TC Cars" }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  const result = token
    ? await verifyEmailAction(token)
    : { success: false as const, error: "Falta el token de verificación" }

  return (
    <AuthCard title={result.success ? "¡Correo confirmado!" : "No pudimos confirmar tu correo"}>
      <p className="text-sm text-muted-foreground">
        {result.success ? result.message : result.error}
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block font-medium text-primary hover:underline"
      >
        Ir a iniciar sesión
      </Link>
    </AuthCard>
  )
}
