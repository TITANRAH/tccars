import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getCollaborator } from "@/features/collaborators/services/collaborator.service"
import { CollaboratorForm } from "@/features/collaborators/components/collaborator-form"

export const metadata = { title: "Editar colaborador — Panel admin" }

function toDateInput(date: Date | null) {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export default async function EditCollaboratorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const collaborator = await getCollaborator(id)
  if (!collaborator) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Editar colaborador</h1>
      <CollaboratorForm
        collaborator={{
          id: collaborator.id,
          firstName: collaborator.firstName,
          lastName: collaborator.lastName,
          email: collaborator.email,
          phone: collaborator.phone ?? "",
          rut: collaborator.rut ?? "",
          position: collaborator.position ?? "",
          birthDate: toDateInput(collaborator.birthDate),
          startDate: toDateInput(collaborator.startDate),
          role: collaborator.role === "ADMIN" ? "ADMIN" : "COLLABORATOR",
        }}
      />
    </div>
  )
}
