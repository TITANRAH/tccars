import { prisma } from "@/lib/prisma"
import type { BusinessHoursInput } from "@/features/business-hours/schemas/business-hours.schema"

const DEFAULT_DAYS = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  // Domingo (0) cerrado por defecto; el resto de la semana abierto 09:00-18:00.
  isOpen: dayOfWeek !== 0,
  openTime: "09:00",
  closeTime: "18:00",
}))

/** Siempre devuelve las 7 filas, en orden — completa con el default cualquiera que falte. */
export async function listBusinessHours() {
  const rows = await prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } })
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]))
  return DEFAULT_DAYS.map((fallback) => byDay.get(fallback.dayOfWeek) ?? fallback)
}

export async function saveBusinessHours(input: BusinessHoursInput) {
  await prisma.$transaction(
    input.days.map((day) =>
      prisma.businessHours.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: { isOpen: day.isOpen, openTime: day.openTime, closeTime: day.closeTime },
        create: day,
      })
    )
  )
}

/**
 * ¿La fecha/hora cae dentro del horario de atención? Si no hay ninguna fila
 * guardada para ese día (nunca se configuró), se usa el default del taller
 * en vez de rechazar todo — así el agendamiento no queda roto mientras el
 * admin no haya tocado /admin/horario todavía.
 */
export async function isWithinBusinessHours(date: Date) {
  const dayOfWeek = date.getDay()
  const row = await prisma.businessHours.findUnique({ where: { dayOfWeek } })
  const schedule = row ?? DEFAULT_DAYS[dayOfWeek]

  if (!schedule.isOpen) return false

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  return time >= schedule.openTime && time < schedule.closeTime
}
