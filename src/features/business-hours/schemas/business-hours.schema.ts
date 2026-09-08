import { z } from "zod"

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const dayScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)"),
    closeTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)"),
  })
  .refine((day) => !day.isOpen || day.openTime < day.closeTime, {
    message: "La hora de apertura debe ser antes que la de cierre",
    path: ["closeTime"],
  })

export const businessHoursSchema = z.object({
  days: z.array(dayScheduleSchema).length(7),
})

export type DayScheduleInput = z.infer<typeof dayScheduleSchema>
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>

export const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const businessHoursExceptionSchema = z
  .object({
    date: z.string().regex(DATE_REGEX, "Fecha inválida (YYYY-MM-DD)"),
    isOpen: z.boolean(),
    openTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)").optional().or(z.literal("")),
    closeTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)").optional().or(z.literal("")),
    note: z.string().max(120).optional().or(z.literal("")),
  })
  .refine((ex) => !ex.isOpen || (ex.openTime && ex.closeTime && ex.openTime < ex.closeTime), {
    message: "Si abre ese día, indica hora de apertura y cierre (apertura antes que cierre)",
    path: ["closeTime"],
  })

export type BusinessHoursExceptionInput = z.infer<typeof businessHoursExceptionSchema>
