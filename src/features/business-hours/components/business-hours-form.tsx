"use client"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { saveBusinessHoursAction } from "@/features/business-hours/actions/business-hours.actions"
import {
  businessHoursSchema,
  DAY_LABELS,
  type BusinessHoursInput,
} from "@/features/business-hours/schemas/business-hours.schema"

export function BusinessHoursForm({ days }: { days: BusinessHoursInput["days"] }) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<BusinessHoursInput>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: { days },
  })

  function onSubmit(values: BusinessHoursInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await saveBusinessHoursAction(values)
      if (!result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success("Horario guardado")
      }
    })
  }

  const watchedDays = useWatch({ control: form.control, name: "days" })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {days.map((_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4"
          >
            <FormField
              control={form.control}
              name={`days.${i}.isOpen`}
              render={({ field }) => (
                <FormItem className="flex w-32 shrink-0 flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 font-bold">{DAY_LABELS[i]}</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`days.${i}.openTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Abre</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={!watchedDays?.[i]?.isOpen} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`days.${i}.closeTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Cierra</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={!watchedDays?.[i]?.isOpen} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar horario"}
        </Button>
      </form>
    </Form>
  )
}
