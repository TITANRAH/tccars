import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getVehicle } from "@/features/vehicles/services/vehicle.service"
import {
  getLatestMileageRecord,
  listMaintenancesForVehicle,
} from "@/features/maintenances/services/maintenance.service"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCLP, formatDateTime } from "@/lib/format"
import { fullName } from "@/lib/user-display"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Vehículo — Panel" }

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN", "COLLABORATOR")
  const { id } = await params
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)
  const vehicle = await getVehicle(id)
  if (!vehicle) notFound()

  const { items: maintenances, totalPages } = await listMaintenancesForVehicle(id, q, page)
  const mileageRecord = await getLatestMileageRecord(id)
  const alert = calculateMaintenanceAlert(mileageRecord)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-bold text-primary">{vehicle.patente}</p>
            {alert?.dueSoon ? <Badge variant="destructive">Mantención próxima</Badge> : null}
          </div>
          <h1 className="text-2xl font-bold">
            {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `(${vehicle.anio})` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dueño: {fullName(vehicle.client)} · {vehicle.client.email}
          </p>
          {alert ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Próxima mantención estimada a los {alert.nextServiceMileage.toLocaleString("es-CL")} km
              (kilometraje estimado hoy: ~{Math.round(alert.estimatedCurrentMileage).toLocaleString("es-CL")} km)
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/colaborador/vehiculos/${id}/editar`}>Editar vehículo</Link>
          </Button>
          <Button asChild>
            <Link href={`/colaborador/mantenciones/nueva?vehicleId=${id}`}>+ Nueva mantención</Link>
          </Button>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold">Historial de mantenciones</h2>
      <div className="mb-4">
        <ListSearch
          basePath={`/colaborador/vehiculos/${id}`}
          placeholder="Buscar por descripción..."
        />
      </div>
      {maintenances.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? "No hay mantenciones que coincidan con la búsqueda." : "Aún no hay mantenciones registradas."}
        </p>
      ) : (
        <div className="space-y-3">
          {maintenances.map((m) => (
            <Link
              key={m.id}
              href={`/colaborador/mantenciones/${m.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {m.type === "MANTENCION" ? "Mantención" : "Visita técnica"}
                </p>
                <Badge variant={m.status === "COMPLETADA" ? "default" : "secondary"}>
                  {m.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {m.scheduledAt ? <span>{formatDateTime(m.scheduledAt)}</span> : null}
                <span>Total: {formatCLP(m.totalCost)}</span>
                {m.collaborator ? <span>Colaborador: {fullName(m.collaborator)}</span> : null}
                {m.images.length > 0 ? <span>{m.images.length} imagen(es)</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
      <ListPagination
        basePath={`/colaborador/vehiculos/${id}`}
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
