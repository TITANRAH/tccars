import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getFaq } from "@/features/faq/services/faq.service"
import { FaqForm } from "@/features/faq/components/faq-form"

export const metadata = { title: "Editar pregunta frecuente — Panel admin" }

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const faq = await getFaq(id)
  if (!faq) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin/faq" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a preguntas frecuentes
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Editar pregunta frecuente</h1>
      <FaqForm
        faq={{
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          order: faq.order,
          published: faq.published,
        }}
      />
    </div>
  )
}
