import Link from "next/link"
import { requireSession } from "@/lib/auth-guards"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { listVehiclesForClient } from "@/features/vehicles/services/vehicle.service"
import { getLatestMileageRecord } from "@/features/maintenances/services/maintenance.service"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Mi cuenta — TC Cars" }

export default async function MiCuentaPage() {
  const session = await requireSession()
  const vehicles = await listVehiclesForClient(session.user.id)

  const vehiclesWithAlert = await Promise.all(
    vehicles.map(async (vehicle) => {
      const record = await getLatestMileageRecord(vehicle.id)
      return { vehicle, alert: calculateMaintenanceAlert(record) }
    })
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Hola, {session.user.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Correo: {session.user.email}</p>

      <h2 className="mt-10 text-lg font-bold">Mis autos</h2>
      {vehicles.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no tienes vehículos registrados. Se agregan cuando visitas el taller.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {vehiclesWithAlert.map(({ vehicle, alert }) => (
            <Link
              key={vehicle.id}
              href={`/mi-cuenta/vehiculos/${vehicle.id}`}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-bold text-primary">{vehicle.patente}</p>
                {alert?.dueSoon ? <Badge variant="destructive">Mantención próxima</Badge> : null}
              </div>
              <p className="mt-1 font-medium text-foreground">
                {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `(${vehicle.anio})` : ""}
              </p>
              {vehicle.color ? (
                <p className="text-xs text-muted-foreground">Color: {vehicle.color}</p>
              ) : null}
              {alert ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Próxima mantención a los {alert.nextServiceMileage.toLocaleString("es-CL")} km
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-primary">Ver historial →</p>
            </Link>
          ))}
        </div>
      )}

      <form action={logoutAction} className="mt-10">
        <Button variant="outline" type="submit">
          Cerrar sesión
        </Button>
      </form>
    </div>
  )
}
