import { requireRole } from "@/lib/auth-guards"
import { VehicleForm } from "@/features/vehicles/components/vehicle-form"

export const metadata = { title: "Registrar vehículo — Panel" }

export default async function NewVehiclePage() {
  await requireRole("ADMIN", "COLLABORATOR")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Registrar vehículo</h1>
      <VehicleForm />
    </div>
  )
}
