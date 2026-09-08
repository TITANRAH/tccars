import { z } from "zod"

export const collaboratorSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa el nombre"),
  lastName: z.string().trim().min(2, "Ingresa el apellido"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  phone: z.string().trim().optional().or(z.literal("")),
  rut: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  birthDate: z.string().trim().optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["COLLABORATOR", "ADMIN"]),
})

export type CollaboratorInput = z.infer<typeof collaboratorSchema>
