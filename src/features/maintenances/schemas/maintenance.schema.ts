import { z } from "zod"

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["MANTENCION", "VISITA_TECNICA"]),
  status: z.enum(["AGENDADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]),
  scheduledAt: z.string().trim().optional().or(z.literal("")),
  collaboratorId: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(5, "Describe el trabajo a realizar"),
  mileage: z.coerce.number().int().min(0).optional(),
  nextServiceMileage: z.coerce.number().int().min(0).optional(),
  laborCost: z.coerce.number().min(0).default(0),
  partsCost: z.coerce.number().min(0).default(0),
  additionalCost: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(["PENDIENTE", "PAGADO", "PARCIAL"]),
})

export type MaintenanceInput = z.infer<typeof maintenanceSchema>
