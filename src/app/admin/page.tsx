import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { Button } from "@/components/ui/button"

const SECTIONS = [
  { href: "/admin/servicios", label: "Servicios", description: "Publicaciones del catálogo de servicios" },
  { href: "/admin/productos", label: "Productos", description: "Productos en venta en el sitio" },
  { href: "/admin/mensajes", label: "Mensajes", description: "Mensajes recibidos por el formulario de contacto" },
  { href: "/colaborador/vehiculos", label: "Vehículos", description: "Registrar y buscar autos por patente" },
  { href: "/colaborador/agenda", label: "Agenda", description: "Calendario general de todas las citas" },
  { href: "/admin/colaboradores", label: "Colaboradores", description: "Crear, editar y habilitar/deshabilitar staff" },
  { href: "/admin/contabilidad", label: "Contabilidad", description: "Ingresos y costos por fecha y colaborador" },
  { href: "/admin/proveedores", label: "Proveedores", description: "A quién n8n les cotiza repuestos" },
  { href: "/admin/cotizaciones", label: "Cotizaciones", description: "Historial de cotizaciones enviadas por n8n" },
]

export const metadata = { title: "Panel admin — TC Cars" }

export default async function AdminPage() {
  const session = await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
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
      <p className="mt-8 text-sm text-muted-foreground">
        Calendario, contabilidad y proveedores llegan en las próximas fases.
      </p>
      <form action={logoutAction} className="mt-8">
        <Button variant="outline" type="submit">
          Cerrar sesión
        </Button>
      </form>
    </div>
  )
}
