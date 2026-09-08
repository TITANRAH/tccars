import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getSupplier } from "@/features/suppliers/services/supplier.service"
import { SupplierForm } from "@/features/suppliers/components/supplier-form"

export const metadata = { title: "Editar proveedor — Panel admin" }

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const supplier = await getSupplier(id)
  if (!supplier) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Editar proveedor</h1>
      <SupplierForm
        supplier={{
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          specialty: supplier.specialty ?? "",
          phone: supplier.phone ?? "",
          active: supplier.active,
        }}
      />
    </div>
  )
}
