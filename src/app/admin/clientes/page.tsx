import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listClients } from "@/features/vehicles/services/vehicle.service"
import { ClientsTable } from "@/features/vehicles/components/clients-table"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Clientes — Panel admin" }

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN", "COLLABORATOR")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: clients, totalPages } = await listClients(q, page)

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-bold">Clientes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Los clientes se crean desde &ldquo;Registrar vehículo&rdquo; en{" "}
        <Link href="/colaborador/vehiculos" className="text-primary hover:underline">
          Vehículos
        </Link>{" "}
        o se registran solos en el sitio. Aquí puedes buscarlos, generar el link para que
        restablezcan su contraseña, y verificar manualmente el correo de quien se registró solo y
        no le llegó el correo de confirmación.
      </p>
      <div className="mb-6">
        <ListSearch basePath="/admin/clientes" placeholder="Buscar por nombre o correo..." />
      </div>
      <ClientsTable clients={clients} />
      <ListPagination
        basePath="/admin/clientes"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
