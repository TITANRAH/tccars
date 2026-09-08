import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  listAllAppointments,
  listAppointmentsForCollaborator,
} from "@/features/appointments/services/appointment.service"
import {
  AppointmentCalendar,
  type AppointmentEvent,
} from "@/features/appointments/components/appointment-calendar"
import { Button } from "@/components/ui/button"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Agenda — Panel" }

export default async function AgendaPage() {
  const session = await requireRole("ADMIN", "COLLABORATOR")

  const appointments =
    session.user.role === "ADMIN"
      ? await listAllAppointments()
      : await listAppointmentsForCollaborator(session.user.id)

  const events: AppointmentEvent[] = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt,
    contactName: a.contactName,
    status: a.status,
    vehiclePatente: a.vehicle?.patente,
    collaboratorName: a.collaborator ? fullName(a.collaborator) : undefined,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/colaborador"}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {session.user.role === "ADMIN" ? "Agenda general" : "Mi agenda"}
        </h1>
        <Button asChild>
          <Link href="/colaborador/agenda/nueva">+ Nueva cita</Link>
        </Button>
      </div>
      <AppointmentCalendar appointments={events} />
    </div>
  )
}
