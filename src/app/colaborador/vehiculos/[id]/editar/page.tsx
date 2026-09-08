import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getVehicle } from "@/features/vehicles/services/vehicle.service"
import { VehicleForm } from "@/features/vehicles/components/vehicle-form"
import { fullName } from "@/lib/user-display"

export const metadata = { title: "Editar vehículo — Panel" }

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN", "COLLABORATOR")
  const { id } = await params
  const vehicle = await getVehicle(id)
  if (!vehicle) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Editar vehículo</h1>
      <VehicleForm
        vehicle={{
          id: vehicle.id,
          patente: vehicle.patente,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          anio: vehicle.anio ?? undefined,
          color: vehicle.color ?? "",
          clientId: vehicle.clientId,
          clientLabel: `${fullName(vehicle.client)} (${vehicle.client.email})`,
        }}
      />
    </div>
  )
}
