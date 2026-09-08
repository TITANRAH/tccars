import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del proveedor"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  specialty: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  active: z.boolean().default(true),
})

export type SupplierInput = z.infer<typeof supplierSchema>
