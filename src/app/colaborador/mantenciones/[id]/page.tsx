import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getMaintenance, listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { deleteMaintenanceAction } from "@/features/maintenances/actions/maintenance.actions"
import { MaintenanceForm } from "@/features/maintenances/components/maintenance-form"
import { MaintenanceImages } from "@/features/maintenances/components/maintenance-images"
import { FichaShareActions } from "@/features/maintenances/components/ficha-share-actions"
import { Button } from "@/components/ui/button"
import { fullName, toStaffOptions } from "@/lib/user-display"

export const metadata = { title: "Mantención — Panel" }

function toDateTimeLocal(date: Date | null) {
  if (!date) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireRole("ADMIN", "COLLABORATOR")
  const { id } = await params
  const maintenance = await getMaintenance(id)
  if (!maintenance) notFound()

  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link
          href={`/colaborador/vehiculos/${maintenance.vehicleId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Volver al vehículo
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {maintenance.vehicle.patente} · {maintenance.vehicle.marca} {maintenance.vehicle.modelo}
        </h1>
        <p className="text-sm text-muted-foreground">
          Dueño: {fullName(maintenance.vehicle.client)} · {maintenance.vehicle.client.email}
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-primary/40 bg-primary/5 p-4">
        {maintenance.fichaDriveFileId ? (
          <>
            <p className="text-sm font-medium text-foreground">Ficha generada por WhatsApp</p>
            <a
              href={`/api/fichas/${maintenance.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Descargar ficha ↓
            </a>
            <FichaShareActions
              maintenanceId={maintenance.id}
              clientPhone={maintenance.vehicle.client.phone}
            />
          </>
        ) : maintenance.status === "COMPLETADA" ? (
          <>
            <p className="text-sm font-medium text-foreground">Ficha generada por el sitio</p>
            <a
              href={`/api/fichas/${maintenance.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Descargar ficha ↓
            </a>
            <FichaShareActions
              maintenanceId={maintenance.id}
              clientPhone={maintenance.vehicle.client.phone}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            La ficha estará disponible para descargar cuando esta mantención esté completada.
          </p>
        )}
      </div>

      <MaintenanceForm
        vehicleId={maintenance.vehicleId}
        staff={toStaffOptions(staff)}
        maintenance={{
          id: maintenance.id,
          vehicleId: maintenance.vehicleId,
          appointmentId: maintenance.appointmentId ?? "",
          type: maintenance.type,
          status: maintenance.status,
          scheduledAt: toDateTimeLocal(maintenance.scheduledAt),
          collaboratorId: maintenance.collaboratorId ?? "",
          description: maintenance.description,
          mileage: maintenance.mileage ?? undefined,
          nextServiceMileage: maintenance.nextServiceMileage ?? undefined,
          laborCost: Number(maintenance.laborCost),
          partsCost: Number(maintenance.partsCost),
          additionalCost: Number(maintenance.additionalCost),
          paymentStatus: maintenance.paymentStatus,
        }}
      />

      <h2 className="mt-10 mb-4 text-lg font-bold">Imágenes</h2>
      <MaintenanceImages maintenanceId={maintenance.id} images={maintenance.images} />

      {session.user.role === "ADMIN" ? (
        <form
          action={deleteMaintenanceAction.bind(null, maintenance.id, maintenance.vehicleId)}
          className="mt-10"
        >
          <Button type="submit" variant="destructive">
            Eliminar mantención
          </Button>
        </form>
      ) : null}
    </div>
  )
}
