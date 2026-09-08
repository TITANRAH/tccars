import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listSuppliers } from "@/features/suppliers/services/supplier.service"
import { SuppliersTable } from "@/features/suppliers/components/suppliers-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Proveedores — Panel admin" }

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: suppliers, totalPages } = await listSuppliers(q, page)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A estos proveedores se les enviarán solicitudes de cotización por voz.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/proveedores/nuevo">+ Nuevo proveedor</Link>
        </Button>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/admin/proveedores" placeholder="Buscar por nombre o correo..." />
      </div>
      <SuppliersTable suppliers={suppliers} />
      <ListPagination
        basePath="/admin/proveedores"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
