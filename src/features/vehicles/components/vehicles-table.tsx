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
import { deleteVehicleAction } from "@/features/vehicles/actions/vehicle.actions"

export type VehicleRow = {
  id: string
  patente: string
  marca: string
  modelo: string
  anio: number | null
  clientName: string
  clientEmail: string
  maintenanceDueSoon?: boolean
}

export function VehiclesTable({
  vehicles,
  canDelete,
}: {
  vehicles: VehicleRow[]
  canDelete: boolean
}) {
  async function handleDelete(id: string) {
    await deleteVehicleAction(id)
    toast.success("Vehículo eliminado")
  }

  if (vehicles.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay vehículos registrados.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patente</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Dueño</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => (
          <TableRow key={vehicle.id}>
            <TableCell className="font-mono font-medium">
              <Link href={`/colaborador/vehiculos/${vehicle.id}`} className="hover:text-primary">
                {vehicle.patente}
              </Link>
              {vehicle.maintenanceDueSoon ? (
                <Badge variant="destructive" className="ml-2 align-middle">
                  Mantención próxima
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>
              {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `(${vehicle.anio})` : ""}
            </TableCell>
            <TableCell>
              {vehicle.clientName}{" "}
              <span className="text-muted-foreground">· {vehicle.clientEmail}</span>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button asChild size="sm" variant="outline">
                <Link href={`/colaborador/vehiculos/${vehicle.id}`}>Ver</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/colaborador/vehiculos/${vehicle.id}/editar`}>Editar</Link>
              </Button>
              {canDelete ? (
                <ConfirmActionButton
                  label="Eliminar"
                  title={`¿Eliminar el vehículo con patente "${vehicle.patente}"?`}
                  description="Se perderá su historial."
                  confirmLabel="Eliminar"
                  onConfirm={() => handleDelete(vehicle.id)}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
