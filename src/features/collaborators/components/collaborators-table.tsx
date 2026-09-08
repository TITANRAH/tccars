"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toggleCollaboratorActiveAction } from "@/features/collaborators/actions/collaborator.actions"

export type CollaboratorRow = {
  id: string
  name: string
  email: string
  position: string | null
  role: "ADMIN" | "COLLABORATOR"
  active: boolean
}

export function CollaboratorsTable({ collaborators }: { collaborators: CollaboratorRow[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, active: boolean, name: string) {
    const verb = active ? "deshabilitar" : "habilitar"
    if (!confirm(`¿Seguro que quieres ${verb} a ${name}?`)) return
    startTransition(async () => {
      await toggleCollaboratorActiveAction(id, !active)
      toast.success(active ? "Colaborador deshabilitado" : "Colaborador habilitado")
    })
  }

  if (collaborators.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay colaboradores.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {collaborators.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">
              {c.name}
              <p className="text-xs text-muted-foreground">{c.email}</p>
            </TableCell>
            <TableCell>{c.position ?? "—"}</TableCell>
            <TableCell>{c.role === "ADMIN" ? "Administrador" : "Colaborador"}</TableCell>
            <TableCell>
              <Badge variant={c.active ? "default" : "secondary"}>
                {c.active ? "Activo" : "Deshabilitado"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/colaboradores/${c.id}/editar`}>Editar</Link>
              </Button>
              <Button
                size="sm"
                variant={c.active ? "destructive" : "outline"}
                disabled={isPending}
                onClick={() => handleToggle(c.id, c.active, c.name)}
              >
                {c.active ? "Deshabilitar" : "Habilitar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
