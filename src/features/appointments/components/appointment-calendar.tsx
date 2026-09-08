"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, dayjsLocalizer, type Event } from "react-big-calendar"
import dayjs from "dayjs"
import "dayjs/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/features/appointments/components/appointment-calendar.css"

dayjs.locale("es")

const localizer = dayjsLocalizer(dayjs)

export type AppointmentEvent = {
  id: string
  scheduledAt: Date
  contactName: string
  status: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA"
  vehiclePatente?: string | null
  collaboratorName?: string | null
}

export function AppointmentCalendar({ appointments }: { appointments: AppointmentEvent[] }) {
  const router = useRouter()

  const events: (Event & { id: string; status: string })[] = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title: `${a.contactName}${a.vehiclePatente ? ` · ${a.vehiclePatente}` : ""}`,
        start: a.scheduledAt,
        end: new Date(a.scheduledAt.getTime() + 60 * 60 * 1000),
        status: a.status,
      })),
    [appointments]
  )

  return (
    <div className="h-[70vh] rounded-xl border border-border bg-card p-3">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="es"
        messages={{
          next: "Sig.",
          previous: "Ant.",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          noEventsInRange: "No hay citas en este rango.",
        }}
        onSelectEvent={(event) => router.push(`/colaborador/agenda/${event.id}`)}
        eventPropGetter={(event) => ({
          className: `rbc-event-status-${(event as unknown as { status: string }).status.toLowerCase()}`,
        })}
      />
    </div>
  )
}
