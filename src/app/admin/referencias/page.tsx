import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listReferences } from "@/features/references/services/reference.service"
import { ReferencesTable } from "@/features/references/components/references-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Referencias — Panel admin" }

export default async function AdminReferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: references, totalPages } = await listReferences(q, page)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referencias de clientes</h1>
        <Button asChild>
          <Link href="/admin/referencias/nueva">+ Nueva referencia</Link>
        </Button>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/admin/referencias" placeholder="Buscar por nombre..." />
      </div>
      <ReferencesTable references={references} />
      <ListPagination
        basePath="/admin/referencias"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
