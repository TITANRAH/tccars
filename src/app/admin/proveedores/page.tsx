import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listSuppliers } from "@/features/suppliers/services/supplier.service"
import { SuppliersTable } from "@/features/suppliers/components/suppliers-table"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Proveedores — Panel admin" }

export default async function AdminSuppliersPage() {
  await requireRole("ADMIN")
  const suppliers = await listSuppliers()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A estos proveedores n8n les enviará solicitudes de cotización por voz.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/proveedores/nuevo">+ Nuevo proveedor</Link>
        </Button>
      </div>
      <SuppliersTable suppliers={suppliers} />
    </div>
  )
}
