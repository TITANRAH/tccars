import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  listBusinessHours,
  listUpcomingBusinessHoursExceptions,
} from "@/features/business-hours/services/business-hours.service"
import { BusinessHoursForm } from "@/features/business-hours/components/business-hours-form"
import { BusinessHoursExceptions } from "@/features/business-hours/components/business-hours-exceptions"

export const metadata = { title: "Horario de atención — Panel" }

export default async function AdminBusinessHoursPage() {
  await requireRole("ADMIN")
  const [days, exceptions] = await Promise.all([
    listBusinessHours(),
    listUpcomingBusinessHoursExceptions(),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-bold">Horario de atención</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Define los días y horas en que el taller agenda citas. Se usa para no ofrecer ni aceptar
        horas fuera de este rango — tanto en el agendamiento por WhatsApp como en la consulta de
        disponibilidad.
      </p>
      <BusinessHoursForm days={days} />
      <div className="mt-10 border-t border-border pt-8">
        <BusinessHoursExceptions exceptions={exceptions} />
      </div>
    </div>
  )
}
