import { z } from "zod"

export const productSchema = z.object({
  name: z.string().trim().min(2, "Ingresa un nombre"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
  description: z.string().trim().min(10, "Describe el producto (mínimo 10 caracteres)"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  imageUrl: z.string().trim().url("URL de imagen inválida").optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).default(0),
  published: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
