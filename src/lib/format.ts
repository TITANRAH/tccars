const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

export function formatCLP(value: number | string | { toString(): string }) {
  return clpFormatter.format(Number(value.toString()))
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
})

// Node y el navegador a veces difieren en qué espacio usan antes de "a. m."
// / "p. m." (angosto sin separación vs normal) — visualmente igual, pero
// rompe la hidratación de componentes cliente que formatean fechas. Se
// normaliza a un espacio común para que servidor y cliente coincidan siempre.
function normalizeSpaces(text: string) {
  return text.replace(/[  ]/g, " ")
}

export function formatDateTime(value: Date | string) {
  return normalizeSpaces(dateTimeFormatter.format(new Date(value)))
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" })

export function formatDate(value: Date | string) {
  return normalizeSpaces(dateFormatter.format(new Date(value)))
}

const appointmentBotLabelFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Santiago",
})

/**
 * Fecha ya formateada (con día de la semana, zona horaria de Chile fija) para
 * mandarle al bot de WhatsApp en cada respuesta que incluya una cita — para
 * que nunca tenga que convertir un ISO a texto él mismo. Se detectó en vivo
 * (2026-09-10) que el modelo se equivocaba tanto el día de la semana como el
 * día del mes al recitar la fecha de una cita ya existente (dijo "13 de
 * septiembre" de una cita real del 12), lo que llevó a mandar una fecha
 * equivocada en un PATCH posterior. Distinto de `formatDate`/`formatDateTime`
 * (sin zona horaria fija, pensadas para el navegador del usuario).
 */
export function formatAppointmentLabelForBot(value: Date | string) {
  return normalizeSpaces(appointmentBotLabelFormatter.format(new Date(value)))
}
