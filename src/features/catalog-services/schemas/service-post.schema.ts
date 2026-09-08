import { z } from "zod"

export { slugify } from "@/lib/slugify"

export const servicePostSchema = z.object({
  title: z.string().trim().min(2, "Ingresa un título"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
  description: z.string().trim().min(10, "Describe el servicio (mínimo 10 caracteres)"),
  imageUrl: z.string().trim().url("URL de imagen inválida").optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
})

export type ServicePostInput = z.infer<typeof servicePostSchema>
