import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata = { title: "Crear cuenta — TC Cars" }

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Regístrate para agendar visitas y ver el historial de tus vehículos."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
