import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { FaqForm } from "@/features/faq/components/faq-form"

export const metadata = { title: "Nueva pregunta frecuente — Panel admin" }

export default async function NewFaqPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin/faq" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a preguntas frecuentes
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Nueva pregunta frecuente</h1>
      <FaqForm />
    </div>
  )
}
