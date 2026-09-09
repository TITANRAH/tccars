import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  listContactMessages,
  type ContactReadFilter,
} from "@/features/contact/services/contact.service"
import { ContactMessagesList } from "@/features/contact/components/contact-messages-list"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"
import { ListStatusFilter } from "@/components/admin/list-status-filter"

export const metadata = { title: "Mensajes de contacto — Panel admin" }

const READ_FILTER_OPTIONS: { value: ContactReadFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "no_leidos", label: "No leídos" },
  { value: "leidos", label: "Leídos" },
]

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; estado?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1", estado = "todos" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)
  const readFilter: ContactReadFilter = READ_FILTER_OPTIONS.some((o) => o.value === estado)
    ? (estado as ContactReadFilter)
    : "todos"

  const { items: messages, totalPages } = await listContactMessages(q, page, readFilter)

  const extraParams = { ...(q ? { q } : {}), ...(readFilter !== "todos" ? { estado: readFilter } : {}) }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Mensajes de contacto</h1>
      <div className="mb-4">
        <ListStatusFilter
          basePath="/admin/mensajes"
          paramName="estado"
          value={readFilter}
          options={READ_FILTER_OPTIONS}
          extraParams={q ? { q } : {}}
        />
      </div>
      <div className="mb-6">
        <ListSearch basePath="/admin/mensajes" placeholder="Buscar por nombre, correo o mensaje..." />
      </div>
      <ContactMessagesList messages={messages} />
      <ListPagination
        basePath="/admin/mensajes"
        page={page}
        totalPages={totalPages}
        extraParams={extraParams}
      />
    </div>
  )
}
