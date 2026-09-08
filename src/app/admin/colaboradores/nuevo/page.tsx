import { requireRole } from "@/lib/auth-guards"
import { CollaboratorForm } from "@/features/collaborators/components/collaborator-form"

export const metadata = { title: "Nuevo colaborador — Panel admin" }

export default async function NewCollaboratorPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Nuevo colaborador</h1>
      <CollaboratorForm />
    </div>
  )
}
