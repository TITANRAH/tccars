import { z } from "zod"

export const referenceSchema = z.object({
  authorName: z.string().trim().min(2, "Ingresa el nombre del cliente"),
  comment: z.string().trim().min(10, "Escribe el comentario (mínimo 10 caracteres)"),
  imageUrl: z.string().trim().url("URL de imagen inválida").optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
})

export type ReferenceInput = z.infer<typeof referenceSchema>
