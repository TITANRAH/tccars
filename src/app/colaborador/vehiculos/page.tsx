import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listVehicles } from "@/features/vehicles/services/vehicle.service"
import { VehiclesTable, type VehicleRow } from "@/features/vehicles/components/vehicles-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"
import { fullName } from "@/lib/user-display"
import { getLatestMileageRecord } from "@/features/maintenances/services/maintenance.service"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"

export const metadata = { title: "Vehículos — Panel" }

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await requireRole("ADMIN", "COLLABORATOR")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items, totalPages } = await listVehicles(q, page)

  const rows: VehicleRow[] = await Promise.all(
    items.map(async (v) => {
      const record = await getLatestMileageRecord(v.id)
      const alert = calculateMaintenanceAlert(record)
      return {
        id: v.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        clientName: fullName(v.client),
        clientEmail: v.client.email,
        maintenanceDueSoon: alert?.dueSoon ?? false,
      }
    })
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/colaborador"}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <Button asChild>
          <Link href="/colaborador/vehiculos/nuevo">+ Registrar vehículo</Link>
        </Button>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/colaborador/vehiculos" placeholder="Buscar por patente..." />
      </div>
      <VehiclesTable vehicles={rows} canDelete={session.user.role === "ADMIN"} />
      <ListPagination
        basePath="/colaborador/vehiculos"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
