import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { ReferenceForm } from "@/features/references/components/reference-form"

export const metadata = { title: "Nueva referencia — Panel admin" }

export default async function NewReferencePage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin/referencias" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a referencias
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-bold">Nueva referencia</h1>
      <ReferenceForm />
    </div>
  )
}
