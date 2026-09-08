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
import { deleteServicePostAction } from "@/features/catalog-services/actions/service-post.actions"
import type { ServicePost } from "@/generated/prisma/client"

export function ServicePostsTable({ servicePosts }: { servicePosts: ServicePost[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar la publicación "${title}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      await deleteServicePostAction(id)
      toast.success("Publicación eliminada")
    })
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
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(post.id, post.title)}
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
