import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listContactMessages } from "@/features/contact/services/contact.service"
import { ContactMessagesList } from "@/features/contact/components/contact-messages-list"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Mensajes de contacto — Panel admin" }

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: messages, totalPages } = await listContactMessages(q, page)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Mensajes de contacto</h1>
      <div className="mb-6">
        <ListSearch basePath="/admin/mensajes" placeholder="Buscar por nombre, correo o mensaje..." />
      </div>
      <ContactMessagesList messages={messages} />
      <ListPagination
        basePath="/admin/mensajes"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
