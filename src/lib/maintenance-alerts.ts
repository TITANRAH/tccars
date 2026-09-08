/**
 * No hay telemetría real del auto (no sabemos su kilometraje actual), así
 * que estimamos cuánto ha avanzado desde la última mantención asumiendo un
 * promedio de uso urbano en Chile. Es una aproximación, no un dato exacto.
 */
const AVERAGE_KM_PER_DAY = 40
const ALERT_THRESHOLD_KM = 10_000

export type MaintenanceAlert = {
  dueSoon: boolean
  estimatedCurrentMileage: number
  remainingKm: number | null
  nextServiceMileage: number
}

export function calculateMaintenanceAlert(
  record: {
    mileage: number | null
    nextServiceMileage: number | null
    createdAt: Date
    scheduledAt?: Date | null
  } | null
): MaintenanceAlert | null {
  if (!record || record.mileage == null || !record.nextServiceMileage) return null

  // scheduledAt es la fecha real del servicio (la que llena el colaborador);
  // createdAt es solo cuándo se guardó el registro en la base, y puede ser
  // muy posterior si la mantención se carga después de haberse hecho.
  const referenceDate = record.scheduledAt ?? record.createdAt
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
  )
  const estimatedCurrentMileage = record.mileage + daysSince * AVERAGE_KM_PER_DAY
  const remainingKm = record.nextServiceMileage - estimatedCurrentMileage

  return {
    dueSoon: remainingKm <= ALERT_THRESHOLD_KM,
    estimatedCurrentMileage,
    remainingKm,
    nextServiceMileage: record.nextServiceMileage,
  }
}
