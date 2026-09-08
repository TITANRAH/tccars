import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listReferences } from "@/features/references/services/reference.service"
import { ReferencesTable } from "@/features/references/components/references-table"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Referencias — Panel admin" }

export default async function AdminReferencesPage() {
  await requireRole("ADMIN")
  const references = await listReferences()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referencias de clientes</h1>
        <Button asChild>
          <Link href="/admin/referencias/nueva">+ Nueva referencia</Link>
        </Button>
      </div>
      <ReferencesTable references={references} />
    </div>
  )
}
