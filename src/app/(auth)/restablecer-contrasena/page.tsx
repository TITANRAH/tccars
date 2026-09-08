import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const metadata = { title: "Restablecer contraseña — TC Cars" }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthCard title="Enlace inválido">
        <p className="text-sm text-muted-foreground">
          El enlace para restablecer tu contraseña no es válido. Solicita uno nuevo desde{" "}
          <Link href="/olvide-contrasena" className="text-primary hover:underline">
            aquí
          </Link>
          .
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Restablece tu contraseña"
      description="Elige una nueva contraseña para tu cuenta."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  )
}
