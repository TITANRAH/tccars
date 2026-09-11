import { prisma } from "@/lib/prisma"
import type {
  BusinessHoursExceptionInput,
  BusinessHoursInput,
} from "@/features/business-hours/schemas/business-hours.schema"

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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * Resuelve qué horario aplica a una fecha puntual — la excepción de ese día
 * exacto si existe, si no el horario semanal normal — y por qué. Separado de
 * `isWithinBusinessHours` para que quien necesite *explicar* un rechazo
 * (ej. el bot de WhatsApp) tenga el motivo real (excepción vs. horario
 * semanal) en vez de tener que adivinarlo. Se detectó en vivo (2026-09-10)
 * que el bot inventaba "cierra a las 18:00" (la hora normal del día) para
 * explicar un rechazo que en realidad era por una excepción de cierre total
 * ese día puntual — una explicación incorrecta porque nunca tuvo el dato real.
 */
async function resolveBusinessHoursForDate(date: Date) {
  const exception = await prisma.businessHoursException.findUnique({
    where: { date: toDateKey(date) },
  })
  if (exception) {
    return {
      isOpen: exception.isOpen && !!exception.openTime && !!exception.closeTime,
      openTime: exception.openTime,
      closeTime: exception.closeTime,
      isException: true,
      note: exception.note,
    }
  }

  const dayOfWeek = date.getDay()
  const row = await prisma.businessHours.findUnique({ where: { dayOfWeek } })
  const schedule = row ?? DEFAULT_DAYS[dayOfWeek]
  return {
    isOpen: schedule.isOpen,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    isException: false,
    note: null as string | null,
  }
}

/**
 * ¿La fecha/hora cae dentro del horario de atención? Primero revisa si esa
 * fecha puntual tiene una excepción (feriado, cierre único, horario especial
 * de un solo día); si no, cae al horario semanal normal. Si no hay ninguna
 * fila guardada para ese día de la semana (nunca se configuró), se usa el
 * default del taller en vez de rechazar todo — así el agendamiento no queda
 * roto mientras el admin no haya tocado /admin/horario todavía.
 */
export async function isWithinBusinessHours(date: Date) {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  const schedule = await resolveBusinessHoursForDate(date)

  if (!schedule.isOpen || !schedule.openTime || !schedule.closeTime) return false
  return time >= schedule.openTime && time < schedule.closeTime
}

/**
 * Igual que `isWithinBusinessHours`, pero además arma un texto explicando el
 * motivo real del rechazo (o de la disponibilidad) — para que el bot de
 * WhatsApp lo repita tal cual en vez de inventar una explicación con datos
 * que no tiene (ver nota en `resolveBusinessHoursForDate`).
 */
export async function describeBusinessHours(date: Date) {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  const schedule = await resolveBusinessHoursForDate(date)

  if (!schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
    return {
      available: false,
      reason: schedule.isException
        ? `Ese día el taller tiene un cierre especial${schedule.note ? ` (${schedule.note})` : ""}, no abre.`
        : "Ese día el taller no atiende (cerrado en el horario semanal habitual).",
    }
  }

  if (time < schedule.openTime || time >= schedule.closeTime) {
    return {
      available: false,
      reason: schedule.isException
        ? `Ese día el taller tiene horario especial: abre de ${schedule.openTime} a ${schedule.closeTime}${schedule.note ? ` (${schedule.note})` : ""}.`
        : `Ese día el taller atiende de ${schedule.openTime} a ${schedule.closeTime}.`,
    }
  }

  return { available: true, reason: null as string | null }
}

/** Excepciones futuras (feriados/cierres puntuales), para mostrar en el panel admin. */
export async function listUpcomingBusinessHoursExceptions() {
  const todayKey = toDateKey(new Date())
  return prisma.businessHoursException.findMany({
    where: { date: { gte: todayKey } },
    orderBy: { date: "asc" },
  })
}

export async function saveBusinessHoursException(input: BusinessHoursExceptionInput) {
  await prisma.businessHoursException.upsert({
    where: { date: input.date },
    update: {
      isOpen: input.isOpen,
      openTime: input.isOpen ? input.openTime || null : null,
      closeTime: input.isOpen ? input.closeTime || null : null,
      note: input.note || null,
    },
    create: {
      date: input.date,
      isOpen: input.isOpen,
      openTime: input.isOpen ? input.openTime || null : null,
      closeTime: input.isOpen ? input.closeTime || null : null,
      note: input.note || null,
    },
  })
}

export async function deleteBusinessHoursException(date: string) {
  await prisma.businessHoursException.delete({ where: { date } })
}
