import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata = { title: "Recuperar contraseña — TC Cars" }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="¿Olvidaste tu contraseña?"
      description="Ingresa tu correo y te enviaremos un enlace para restablecerla."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
