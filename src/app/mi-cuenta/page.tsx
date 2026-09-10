import Link from "next/link"
import { requireSession } from "@/lib/auth-guards"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { listVehiclesForClient } from "@/features/vehicles/services/vehicle.service"
import { getLatestMileageRecord } from "@/features/maintenances/services/maintenance.service"
import { listUpcomingAppointmentsForClient } from "@/features/appointments/services/appointment.service"
import { calculateMaintenanceAlert } from "@/lib/maintenance-alerts"
import { formatDateTime } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Mi cuenta — TC Cars" }

const WHATSAPP_NUMBER = "56934517178"

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente de confirmar",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
}

export default async function MiCuentaPage() {
  const session = await requireSession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  })
  const vehicles = await listVehiclesForClient(session.user.id)
  const appointments = await listUpcomingAppointmentsForClient(session.user.id, user?.phone ?? null)

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

      <h2 className="mt-10 text-lg font-bold">Mis citas</h2>
      {appointments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No tienes citas agendadas. Puedes pedir una por WhatsApp.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {appointments.map((appointment) => {
            const whatsappMessage =
              appointment.status === "PENDIENTE"
                ? `Hola, quiero confirmar mi cita del ${formatDateTime(appointment.scheduledAt)}.`
                : `Hola, necesito reagendar o cancelar mi cita del ${formatDateTime(appointment.scheduledAt)}.`
            return (
              <div key={appointment.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {formatDateTime(appointment.scheduledAt)}
                  </p>
                  <Badge variant={appointment.status === "CONFIRMADA" ? "default" : "secondary"}>
                    {STATUS_LABEL[appointment.status] ?? appointment.status}
                  </Badge>
                </div>
                {appointment.vehicle ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.vehicle.marca} {appointment.vehicle.modelo} —{" "}
                    {appointment.vehicle.patente}
                  </p>
                ) : null}
                {appointment.notes ? (
                  <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
                ) : null}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white transition-transform hover:scale-105"
                >
                  Reagendar o cancelar por WhatsApp
                </a>
              </div>
            )
          })}
        </div>
      )}

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
