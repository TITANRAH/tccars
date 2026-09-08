import { z } from "zod"

export const highlightSchema = z.object({
  title: z.string().trim().min(2, "Ingresa un título"),
  description: z.string().trim().min(10, "Describe la novedad (mínimo 10 caracteres)"),
  imageUrl: z.string().trim().url("URL de imagen inválida").optional().or(z.literal("")),
  ctaLabel: z.string().trim().min(1, "Ingresa el texto del botón").default("Ver más"),
  ctaHref: z.string().trim().min(1, "Ingresa a dónde debe llevar el botón"),
  active: z.boolean().default(true),
})

export type HighlightInput = z.infer<typeof highlightSchema>
