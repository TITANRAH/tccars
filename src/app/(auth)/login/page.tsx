import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata = { title: "Iniciar sesión — TC Cars" }

export default function LoginPage() {
  return (
    <AuthCard
      title="Inicia sesión"
      description="Accede para revisar tu agenda, tus vehículos o el panel del taller."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Crea una aquí
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
