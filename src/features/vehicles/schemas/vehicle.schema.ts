import { z } from "zod"
import { normalizePhone } from "@/lib/phone"

export function normalizePatente(value: string) {
  return value.toUpperCase().replace(/[\s.-]/g, "")
}

export const vehicleSchema = z.object({
  patente: z
    .string()
    .trim()
    .transform(normalizePatente)
    .pipe(z.string().regex(/^[A-Z0-9]{4,8}$/, "Patente inválida (4 a 8 letras/números)")),
  marca: z.string().trim().min(1, "Ingresa la marca"),
  modelo: z.string().trim().min(1, "Ingresa el modelo"),
  anio: z.coerce
    .number()
    .int()
    .min(1950, "Año inválido")
    .max(new Date().getFullYear() + 1, "Año inválido")
    .optional(),
  color: z.string().trim().optional().or(z.literal("")),
  clientId: z.string().min(1, "Selecciona un cliente"),
})

export type VehicleInput = z.infer<typeof vehicleSchema>

export const newClientSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa el nombre del cliente"),
  lastName: z.string().trim().min(2, "Ingresa el apellido del cliente"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? normalizePhone(v) : v))
    .optional(),
})

export type NewClientInput = z.infer<typeof newClientSchema>
