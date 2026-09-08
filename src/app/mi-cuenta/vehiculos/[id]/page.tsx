import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requireSession } from "@/lib/auth-guards"
import { getVehicle } from "@/features/vehicles/services/vehicle.service"
import {
  getLatestMileageRecord,
  listMaintenancesForVehicle,
} from "@/features/maintenances/services/maintenance.service"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"
import { MaintenanceImages } from "@/features/maintenances/components/maintenance-images"
import { Badge } from "@/components/ui/badge"
import { formatCLP, formatDateTime } from "@/lib/format"

export const metadata = { title: "Mi vehículo — TC Cars" }

export default async function ClientVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params
  const vehicle = await getVehicle(id)
  if (!vehicle) notFound()
  if (vehicle.clientId !== session.user.id) redirect("/mi-cuenta")

  const maintenances = await listMaintenancesForVehicle(id)
  const alert = calculateMaintenanceAlert(await getLatestMileageRecord(id))

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/mi-cuenta" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a mi cuenta
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <p className="font-mono text-sm font-bold text-primary">{vehicle.patente}</p>
        {alert?.dueSoon ? <Badge variant="destructive">Mantención próxima</Badge> : null}
      </div>
      <h1 className="text-2xl font-bold">
        {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `(${vehicle.anio})` : ""}
      </h1>
      {alert ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Próxima mantención estimada a los {alert.nextServiceMileage.toLocaleString("es-CL")} km.
        </p>
      ) : null}

      <h2 className="mt-10 mb-4 text-lg font-bold">Historial de mantenciones</h2>
      {maintenances.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay mantenciones registradas.</p>
      ) : (
        <div className="space-y-4">
          {maintenances.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
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
              </div>
              {m.fichaDriveFileId || m.status === "COMPLETADA" ? (
                <a
                  href={`/api/fichas/${m.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Descargar ficha ↓
                </a>
              ) : null}
              {m.images.length > 0 ? (
                <div className="mt-3">
                  <MaintenanceImages maintenanceId={m.id} images={m.images} readOnly />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
