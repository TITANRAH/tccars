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

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value))
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" })

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value))
}
