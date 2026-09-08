import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getAppointment } from "@/features/appointments/services/appointment.service"
import { deleteAppointmentAction } from "@/features/appointments/actions/appointment.actions"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { AppointmentForm } from "@/features/appointments/components/appointment-form"
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
  await requireRole("ADMIN", "COLLABORATOR")
  const { id } = await params
  const appointment = await getAppointment(id)
  if (!appointment) notFound()

  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-bold">Editar cita</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Origen: {appointment.source === "WEB" ? "Sitio web" : "WhatsApp (n8n)"}
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
      <form action={deleteAppointmentAction.bind(null, appointment.id)} className="mt-6">
        <Button type="submit" variant="destructive">
          Eliminar cita
        </Button>
      </form>
    </div>
  )
}
