import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listCollaborators } from "@/features/collaborators/services/collaborator.service"
import {
  CollaboratorsTable,
  type CollaboratorRow,
} from "@/features/collaborators/components/collaborators-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Colaboradores — Panel admin" }

export default async function AdminCollaboratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: collaborators, totalPages } = await listCollaborators(q, page)

  const rows: CollaboratorRow[] = collaborators.map((c) => ({
    id: c.id,
    name: fullName(c),
    email: c.email,
    position: c.position,
    role: c.role as "ADMIN" | "COLLABORATOR",
    active: c.active,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <Button asChild>
          <Link href="/admin/colaboradores/nuevo">+ Nuevo colaborador</Link>
        </Button>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/admin/colaboradores" placeholder="Buscar por nombre o correo..." />
      </div>
      <CollaboratorsTable collaborators={rows} />
      <ListPagination
        basePath="/admin/colaboradores"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
