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
