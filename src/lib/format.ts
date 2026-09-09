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
