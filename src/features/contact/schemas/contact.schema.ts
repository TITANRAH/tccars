import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  phone: z.string().trim().min(8, "Ingresa un teléfono válido"),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)"),
  privacyAccepted: z
    .boolean()
    .refine((value) => value === true, "Debes aceptar la política de privacidad"),
})

export type ContactInput = z.infer<typeof contactSchema>
