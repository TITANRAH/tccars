import { notFound, redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getVehicle } from "@/features/vehicles/services/vehicle.service"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { getAppointment } from "@/features/appointments/services/appointment.service"
import { MaintenanceForm } from "@/features/maintenances/components/maintenance-form"
import { toStaffOptions } from "@/lib/user-display"

export const metadata = { title: "Nueva mantención — Panel" }

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string; appointmentId?: string }>
}) {
  await requireRole("ADMIN", "COLLABORATOR")
  const { vehicleId: vehicleIdParam, appointmentId } = await searchParams

  const appointment = appointmentId ? await getAppointment(appointmentId) : null
  if (appointmentId && !appointment) notFound()
  if (appointment?.maintenance) redirect(`/colaborador/mantenciones/${appointment.maintenance.id}`)

  const vehicleId = appointment?.vehicleId ?? vehicleIdParam
  if (!vehicleId) notFound()

  const vehicle = await getVehicle(vehicleId)
  if (!vehicle) notFound()

  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Nueva mantención</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        {vehicle.patente} · {vehicle.marca} {vehicle.modelo}
      </p>
      <MaintenanceForm
        vehicleId={vehicleId}
        staff={toStaffOptions(staff)}
        appointmentId={appointment?.id}
        prefill={
          appointment
            ? {
                scheduledAt: toDateTimeLocal(appointment.scheduledAt),
                collaboratorId: appointment.collaboratorId ?? "",
              }
            : undefined
        }
      />
    </div>
  )
}
