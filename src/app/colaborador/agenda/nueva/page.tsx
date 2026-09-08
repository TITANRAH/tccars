import { requireRole } from "@/lib/auth-guards"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { AppointmentForm } from "@/features/appointments/components/appointment-form"
import { toStaffOptions } from "@/lib/user-display"

export const metadata = { title: "Nueva cita — Panel" }

export default async function NewAppointmentPage() {
  await requireRole("ADMIN", "COLLABORATOR")
  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Nueva cita</h1>
      <AppointmentForm staff={toStaffOptions(staff)} />
    </div>
  )
}
