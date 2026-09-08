import { Clock } from "lucide-react"
import { DAY_LABELS } from "@/features/business-hours/schemas/business-hours.schema"

type DaySchedule = {
  dayOfWeek: number
  isOpen: boolean
  openTime: string
  closeTime: string
}

type ExceptionRow = {
  date: string
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
  note: string | null
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
}

/** Horario de atención público, tal como lo dejó configurado el ADMIN en /admin/horario. */
export function BusinessHoursDisplay({
  days,
  exceptions,
}: {
  days: DaySchedule[]
  exceptions: ExceptionRow[]
}) {
  const today = new Date().getDay()
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => days.find((d) => d.dayOfWeek === dayOfWeek)!)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="size-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Horario de atención</h2>
      </div>
      <ul className="space-y-1.5 text-sm">
        {ordered.map((day) => (
          <li
            key={day.dayOfWeek}
            className={`flex items-center justify-between gap-4 ${
              day.dayOfWeek === today ? "font-bold text-foreground" : "text-muted-foreground"
            }`}
          >
            <span>{DAY_LABELS[day.dayOfWeek]}</span>
            <span className="tabular-nums">
              {day.isOpen ? `${day.openTime} – ${day.closeTime}` : "Cerrado"}
            </span>
          </li>
        ))}
      </ul>

      {exceptions.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Próximos cierres o cambios de horario
          </p>
          <ul className="space-y-1.5 text-sm">
            {exceptions.map((ex) => (
              <li key={ex.date} className="flex items-center justify-between gap-4 text-muted-foreground">
                <span className="capitalize">
                  {formatDateLabel(ex.date)}
                  {ex.note ? ` (${ex.note})` : ""}
                </span>
                <span className="tabular-nums">
                  {ex.isOpen && ex.openTime && ex.closeTime
                    ? `${ex.openTime} – ${ex.closeTime}`
                    : "Cerrado"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
