import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listCollaborators } from "@/features/collaborators/services/collaborator.service"
import {
  CollaboratorsTable,
  type CollaboratorRow,
} from "@/features/collaborators/components/collaborators-table"
import { Button } from "@/components/ui/button"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Colaboradores — Panel admin" }

export default async function AdminCollaboratorsPage() {
  await requireRole("ADMIN")
  const collaborators = await listCollaborators()

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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <Button asChild>
          <Link href="/admin/colaboradores/nuevo">+ Nuevo colaborador</Link>
        </Button>
      </div>
      <CollaboratorsTable collaborators={rows} />
    </div>
  )
}
