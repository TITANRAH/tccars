import { z } from "zod"

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Ingresa la pregunta (mínimo 5 caracteres)"),
  answer: z.string().trim().min(5, "Ingresa la respuesta (mínimo 5 caracteres)"),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
})

export type FaqInput = z.infer<typeof faqSchema>
