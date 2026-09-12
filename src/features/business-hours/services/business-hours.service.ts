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

// getUTC*(), no getFullYear()/getMonth()/getDate() — mismo motivo que el
// resto del archivo: en producción (Vercel, UTC) da exactamente lo mismo,
// pero usar los getters UTC explícitos hace que esta función (y quien la
// use, como `findNextOpenDays`) dé el resultado correcto sin importar en qué
// zona horaria corra el proceso — se detectó una fecha desalineada un día
// entero al probar `findNextOpenDays` en una máquina que no corre en UTC.
function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
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

  // getUTCDay(), no getDay() — mismo motivo que el resto del archivo: los
  // dígitos guardados ya son la hora de Chile sin convertir, y en producción
  // (Vercel, UTC) local == UTC siempre; usar el getter UTC explícito evita
  // que este cálculo dependa de en qué zona horaria corra el proceso (ej. al
  // probar este código desde una máquina local que no está en UTC).
  const dayOfWeek = date.getUTCDay()
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

const openDayLabelFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  // timeZone "UTC" a propósito — mismo motivo que el resto de este archivo:
  // los dígitos guardados ya representan la hora de Chile, sin convertir.
  timeZone: "UTC",
})

/**
 * Los próximos `count` días realmente abiertos desde `from` (inclusive),
 * saltándose los cerrados por horario semanal o por excepción — para que el
 * bot de WhatsApp pueda sugerir una alternativa real en vez de adivinar un
 * día cercano "porque suena razonable". Se detectó en vivo (2026-09-10) que,
 * aunque el prompt le pedía verificar antes de sugerir, el modelo igual
 * ofreció un día que estaba cerrado — reforzar el prompt no bastó, así que
 * ahora el propio backend calcula la alternativa real, sin dejarle a la IA
 * la posibilidad de inventar.
 */
export async function findNextOpenDays(from: Date, count: number, maxLookAheadDays = 21) {
  const results: { date: string; label: string; openTime: string; closeTime: string }[] = []

  for (let i = 0; i < maxLookAheadDays && results.length < count; i++) {
    const candidate = new Date(from)
    candidate.setUTCDate(candidate.getUTCDate() + i)
    candidate.setUTCHours(0, 0, 0, 0)

    const schedule = await resolveBusinessHoursForDate(candidate)
    if (schedule.isOpen && schedule.openTime && schedule.closeTime) {
      results.push({
        date: toDateKey(candidate),
        label: `${openDayLabelFormatter.format(candidate)} (${schedule.openTime}–${schedule.closeTime})`,
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
      })
    }
  }

  return results
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
