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
import { deleteReferenceAction } from "@/features/references/actions/reference.actions"
import type { Reference } from "@/generated/prisma/client"

export function ReferencesTable({ references }: { references: Reference[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, authorName: string) {
    if (!confirm(`¿Eliminar la referencia de "${authorName}"? Esta acción no se puede deshacer.`))
      return
    startTransition(async () => {
      await deleteReferenceAction(id)
      toast.success("Referencia eliminada")
    })
  }

  if (references.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay referencias cargadas.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orden</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {references.map((reference) => (
          <TableRow key={reference.id}>
            <TableCell>{reference.order}</TableCell>
            <TableCell className="font-medium">{reference.authorName}</TableCell>
            <TableCell>
              <Badge variant={reference.published ? "default" : "secondary"}>
                {reference.published ? "Publicada" : "Borrador"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/referencias/${reference.id}/editar`}>Editar</Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(reference.id, reference.authorName)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
