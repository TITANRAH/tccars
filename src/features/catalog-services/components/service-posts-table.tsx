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
import { deleteServicePostAction } from "@/features/catalog-services/actions/service-post.actions"
import type { ServicePost } from "@/generated/prisma/client"

export function ServicePostsTable({ servicePosts }: { servicePosts: ServicePost[] }) {
  async function handleDelete(id: string) {
    await deleteServicePostAction(id)
    toast.success("Publicación eliminada")
  }

  if (servicePosts.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay servicios publicados.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orden</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicePosts.map((post) => (
          <TableRow key={post.id}>
            <TableCell>{post.order}</TableCell>
            <TableCell className="font-medium">{post.title}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={post.published ? "default" : "secondary"}>
                  {post.published ? "Publicado" : "Borrador"}
                </Badge>
                {post.featured ? <Badge variant="outline">⭐ Estrella</Badge> : null}
              </div>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/servicios/${post.id}/editar`}>Editar</Link>
              </Button>
              <ConfirmActionButton
                label="Eliminar"
                title={`¿Eliminar la publicación "${post.title}"?`}
                description="Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => handleDelete(post.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
