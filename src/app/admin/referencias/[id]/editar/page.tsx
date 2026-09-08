import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getReference } from "@/features/references/services/reference.service"
import { ReferenceForm } from "@/features/references/components/reference-form"

export const metadata = { title: "Editar referencia — Panel admin" }

export default async function EditReferencePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const reference = await getReference(id)
  if (!reference) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin/referencias" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a referencias
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Editar referencia</h1>
      <ReferenceForm
        reference={{
          id: reference.id,
          authorName: reference.authorName,
          comment: reference.comment,
          imageUrl: reference.imageUrl ?? "",
          order: reference.order,
          published: reference.published,
        }}
      />
    </div>
  )
}
