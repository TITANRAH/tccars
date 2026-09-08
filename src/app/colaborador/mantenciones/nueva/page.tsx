import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getVehicle } from "@/features/vehicles/services/vehicle.service"
import { listStaffUsers } from "@/features/maintenances/services/maintenance.service"
import { MaintenanceForm } from "@/features/maintenances/components/maintenance-form"
import { toStaffOptions } from "@/lib/user-display"

export const metadata = { title: "Nueva mantención — Panel" }

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>
}) {
  await requireRole("ADMIN", "COLLABORATOR")
  const { vehicleId } = await searchParams
  if (!vehicleId) notFound()

  const vehicle = await getVehicle(vehicleId)
  if (!vehicle) notFound()

  const staff = await listStaffUsers()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Nueva mantención</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        {vehicle.patente} · {vehicle.marca} {vehicle.modelo}
      </p>
      <MaintenanceForm vehicleId={vehicleId} staff={toStaffOptions(staff)} />
    </div>
  )
}
