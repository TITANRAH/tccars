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
import { deleteSupplierAction } from "@/features/suppliers/actions/supplier.actions"
import type { Supplier } from "@/generated/prisma/client"

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  async function handleDelete(id: string) {
    await deleteSupplierAction(id)
    toast.success("Proveedor eliminado")
  }

  if (suppliers.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay proveedores registrados.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Especialidad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">
              {supplier.name}
              <p className="text-xs text-muted-foreground">{supplier.email}</p>
            </TableCell>
            <TableCell>{supplier.specialty ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={supplier.active ? "default" : "secondary"}>
                {supplier.active ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/proveedores/${supplier.id}/editar`}>Editar</Link>
              </Button>
              <ConfirmActionButton
                label="Eliminar"
                title={`¿Eliminar al proveedor "${supplier.name}"?`}
                confirmLabel="Eliminar"
                onConfirm={() => handleDelete(supplier.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
