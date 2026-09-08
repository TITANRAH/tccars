import { z } from "zod"

export const appointmentSchema = z.object({
  vehicleId: z.string().trim().optional().or(z.literal("")),
  collaboratorId: z.string().trim().optional().or(z.literal("")),
  scheduledAt: z.string().trim().min(1, "Selecciona fecha y hora"),
  contactName: z.string().trim().min(2, "Ingresa el nombre del cliente"),
  contactPhone: z.string().trim().min(6, "Ingresa un teléfono válido"),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"]),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
