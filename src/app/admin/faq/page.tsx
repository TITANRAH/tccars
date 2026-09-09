import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listFaqs } from "@/features/faq/services/faq.service"
import { FaqTable } from "@/features/faq/components/faq-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Preguntas frecuentes — Panel admin" }

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: faqs, totalPages } = await listFaqs(q, page)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Preguntas frecuentes</h1>
        <Button asChild>
          <Link href="/admin/faq/nueva">+ Nueva pregunta</Link>
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Estas preguntas y respuestas las usa el bot de WhatsApp para responder dudas sobre el taller
        que no son servicios ni horario (precios, políticas, marcas que atienden, etc.).
      </p>
      <div className="mb-6">
        <ListSearch basePath="/admin/faq" placeholder="Buscar por pregunta..." />
      </div>
      <FaqTable faqs={faqs} />
      <ListPagination
        basePath="/admin/faq"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
