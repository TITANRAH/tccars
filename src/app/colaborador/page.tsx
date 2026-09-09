import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { Button } from "@/components/ui/button"

const SECTIONS = [
  { href: "/colaborador/agenda", label: "Agenda", description: "Calendario de citas agendadas" },
  {
    href: "/colaborador/mantenciones",
    label: "Mantenciones",
    description: "Tus mantenciones asignadas y pendientes",
  },
  { href: "/colaborador/vehiculos", label: "Vehículos", description: "Registrar y buscar autos por patente" },
  { href: "/admin/clientes", label: "Clientes", description: "Buscar clientes y generar link de contraseña" },
]

export const metadata = { title: "Panel colaborador — TC Cars" }

export default async function CollaboratorPage() {
  const session = await requireRole("COLLABORATOR", "ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Panel de colaborador</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sesión: {session.user.name} ({session.user.role})
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <p className="font-bold text-foreground">{section.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          </Link>
        ))}
      </div>
      <form action={logoutAction} className="mt-8">
        <Button variant="outline" type="submit">
          Cerrar sesión
        </Button>
      </form>
    </div>
  )
}
