import { z } from "zod"

export const accountingFilterSchema = z.object({
  from: z.string().trim().optional().or(z.literal("")),
  to: z.string().trim().optional().or(z.literal("")),
  collaboratorId: z.string().trim().optional().or(z.literal("")),
})

export type AccountingFilterInput = z.infer<typeof accountingFilterSchema>
