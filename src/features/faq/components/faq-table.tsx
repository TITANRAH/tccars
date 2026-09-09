"use client"

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
import { ConfirmActionButton } from "@/components/admin/confirm-action-button"
import { deleteFaqAction } from "@/features/faq/actions/faq.actions"
import type { FaqEntry } from "@/generated/prisma/client"

export function FaqTable({ faqs }: { faqs: FaqEntry[] }) {
  async function handleDelete(id: string) {
    await deleteFaqAction(id)
    toast.success("Pregunta eliminada")
  }

  if (faqs.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay preguntas frecuentes cargadas.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orden</TableHead>
          <TableHead>Pregunta</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {faqs.map((faq) => (
          <TableRow key={faq.id}>
            <TableCell>{faq.order}</TableCell>
            <TableCell className="font-medium">{faq.question}</TableCell>
            <TableCell>
              <Badge variant={faq.published ? "default" : "secondary"}>
                {faq.published ? "Publicada" : "Borrador"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/faq/${faq.id}/editar`}>Editar</Link>
              </Button>
              <ConfirmActionButton
                label="Eliminar"
                title={`¿Eliminar la pregunta "${faq.question}"?`}
                description="Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => handleDelete(faq.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
