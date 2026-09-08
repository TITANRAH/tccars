import { Cog, Zap, CircleGauge, MonitorCog, Wrench, type LucideIcon } from "lucide-react"

/**
 * Ícono por slug para los servicios "core" del taller (los que aparecen en la
 * imagen de marca). Cualquier servicio nuevo que agregue el admin cae en el
 * ícono genérico (Wrench).
 */
const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  "ajustes-de-motor": Cog,
  afinamientos: Zap,
  embragues: CircleGauge,
  scanner: MonitorCog,
  mantenciones: Wrench,
}

export function iconForServiceSlug(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Wrench
}
