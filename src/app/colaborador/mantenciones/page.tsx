import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import {
  listAllMaintenances,
  listMaintenancesForCollaborator,
} from "@/features/maintenances/services/maintenance.service"
import { Badge } from "@/components/ui/badge"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"
import { formatCLP, formatDateTime } from "@/lib/format"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Mantenciones — Panel" }

export default async function CollaboratorMaintenancesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; todas?: string }>
}) {
  const session = await requireRole("ADMIN", "COLLABORATOR")
  const { q = "", page: pageParam = "1", todas } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)
  const includeFinished = todas === "1"

  const { items: maintenances, totalPages } =
    session.user.role === "ADMIN"
      ? await listAllMaintenances(q, page, includeFinished)
      : await listMaintenancesForCollaborator(session.user.id, q, page, includeFinished)

  const extraParams = { ...(q ? { q } : {}), ...(includeFinished ? { todas: "1" } : {}) }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/colaborador"}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {session.user.role === "ADMIN" ? "Mantenciones" : "Mis mantenciones"}
        </h1>
        <Link
          href={
            includeFinished
              ? `/colaborador/mantenciones${q ? `?q=${encodeURIComponent(q)}` : ""}`
              : `/colaborador/mantenciones?todas=1${q ? `&q=${encodeURIComponent(q)}` : ""}`
          }
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {includeFinished ? "Ocultar completadas y canceladas" : "Mostrar completadas y canceladas"}
        </Link>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/colaborador/mantenciones" placeholder="Buscar por descripción..." />
      </div>
      {maintenances.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? "No hay mantenciones que coincidan con la búsqueda." : "No hay mantenciones para mostrar."}
        </p>
      ) : (
        <div className="space-y-3">
          {maintenances.map((m) => (
            <Link
              key={m.id}
              href={`/colaborador/mantenciones/${m.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {m.vehicle.patente} · {m.vehicle.marca} {m.vehicle.modelo}
                </p>
                <Badge variant={m.status === "COMPLETADA" ? "default" : "secondary"}>{m.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {m.scheduledAt ? <span>{formatDateTime(m.scheduledAt)}</span> : null}
                <span>Total: {formatCLP(m.totalCost)}</span>
                {session.user.role === "ADMIN" && m.collaborator ? (
                  <span>Colaborador: {fullName(m.collaborator)}</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
      <ListPagination
        basePath="/colaborador/mantenciones"
        page={page}
        totalPages={totalPages}
        extraParams={extraParams}
      />
    </div>
  )
}
