import { requireRole } from "@/lib/auth-guards"
import { SupplierForm } from "@/features/suppliers/components/supplier-form"

export const metadata = { title: "Nuevo proveedor — Panel admin" }

export default async function NewSupplierPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Nuevo proveedor</h1>
      <SupplierForm />
    </div>
  )
}
