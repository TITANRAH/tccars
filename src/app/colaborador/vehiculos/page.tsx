import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  listVehicles,
  searchVehiclesByPatente,
} from "@/features/vehicles/services/vehicle.service"
import { VehiclesTable, type VehicleRow } from "@/features/vehicles/components/vehicles-table"
import { VehicleSearchBox } from "@/features/vehicles/components/vehicle-search-box"
import { Button } from "@/components/ui/button"
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
  const { q, page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const vehicles = q ? await searchVehiclesByPatente(q) : null
  const vehiclePage = q ? null : await listVehicles(page)
  const list = vehicles ?? vehiclePage!.items

  const rows: VehicleRow[] = await Promise.all(
    list.map(async (v) => {
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <Button asChild>
          <Link href="/colaborador/vehiculos/nuevo">+ Registrar vehículo</Link>
        </Button>
      </div>
      <div className="mb-6">
        <VehicleSearchBox />
      </div>
      <VehiclesTable vehicles={rows} canDelete={session.user.role === "ADMIN"} />

      {!q && vehiclePage && vehiclePage.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/colaborador/vehiculos?page=${page - 1}`}>Anterior</Link>
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Página {page} de {vehiclePage.totalPages}
          </span>
          {page < vehiclePage.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/colaborador/vehiculos?page=${page + 1}`}>Siguiente</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
