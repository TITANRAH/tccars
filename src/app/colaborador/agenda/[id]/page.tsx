import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getAppointment } from "@/features/appointments/services/appointment.service"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { AppointmentForm } from "@/features/appointments/components/appointment-form"
import { DeleteAppointmentButton } from "@/features/appointments/components/delete-appointment-button"
import { Button } from "@/components/ui/button"
import { toStaffOptions } from "@/lib/user-display"

export const metadata = { title: "Cita — Panel" }

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireRole("ADMIN", "COLLABORATOR")
  const { id } = await params
  const appointment = await getAppointment(id)
  if (!appointment) notFound()

  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/colaborador"}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Volver al panel
      </Link>
      <span className="mx-2 text-sm text-muted-foreground/50">·</span>
      <Link href="/colaborador/agenda" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver a la agenda
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-bold">Editar cita</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Origen: {appointment.source === "WEB" ? "Sitio web" : "WhatsApp"}
      </p>
      <AppointmentForm
        staff={toStaffOptions(staff)}
        appointment={{
          id: appointment.id,
          vehicleId: appointment.vehicleId ?? "",
          vehicleLabel: appointment.vehicle
            ? `${appointment.vehicle.patente} · ${appointment.vehicle.marca} ${appointment.vehicle.modelo}`
            : undefined,
          collaboratorId: appointment.collaboratorId ?? "",
          scheduledAt: toDateTimeLocal(appointment.scheduledAt),
          contactName: appointment.contactName,
          contactPhone: appointment.contactPhone,
          notes: appointment.notes ?? "",
          status: appointment.status,
        }}
      />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {appointment.maintenance ? (
          <Button asChild variant="outline">
            <Link href={`/colaborador/mantenciones/${appointment.maintenance.id}`}>
              Ver mantención
            </Link>
          </Button>
        ) : appointment.vehicleId ? (
          <Button asChild variant="outline">
            <Link href={`/colaborador/mantenciones/nueva?appointmentId=${appointment.id}`}>
              Crear mantención
            </Link>
          </Button>
        ) : null}
        <DeleteAppointmentButton appointmentId={appointment.id} />
      </div>
    </div>
  )
}
