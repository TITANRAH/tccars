"use client"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  deleteBusinessHoursExceptionAction,
  saveBusinessHoursExceptionAction,
} from "@/features/business-hours/actions/business-hours.actions"
import {
  businessHoursExceptionSchema,
  type BusinessHoursExceptionInput,
} from "@/features/business-hours/schemas/business-hours.schema"

type ExceptionRow = {
  date: string
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
  note: string | null
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
}

export function BusinessHoursExceptions({ exceptions }: { exceptions: ExceptionRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [deletingDate, setDeletingDate] = useState<string | null>(null)

  const form = useForm<BusinessHoursExceptionInput>({
    resolver: zodResolver(businessHoursExceptionSchema),
    defaultValues: { date: "", isOpen: false, openTime: "", closeTime: "", note: "" },
  })

  const isOpen = useWatch({ control: form.control, name: "isOpen" })

  function onSubmit(values: BusinessHoursExceptionInput) {
    startTransition(async () => {
      const result = await saveBusinessHoursExceptionAction(values)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Excepción guardada")
        form.reset({ date: "", isOpen: false, openTime: "", closeTime: "", note: "" })
      }
    })
  }

  function handleDelete(date: string) {
    setDeletingDate(date)
    startTransition(async () => {
      await deleteBusinessHoursExceptionAction(date)
      toast.success("Excepción eliminada")
      setDeletingDate(null)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold">Fechas puntuales (feriados, cierres únicos)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Para cerrar o cambiar el horario de un solo día, sin afectar ese mismo día de la semana
          en el futuro. Ej: cerrar el 18 de septiembre sin dejar de atender los demás jueves.
        </p>

        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay excepciones programadas.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {exceptions.map((ex) => (
              <li
                key={ex.date}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium capitalize">{formatDateLabel(ex.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {ex.isOpen && ex.openTime && ex.closeTime
                      ? `Horario especial: ${ex.openTime} – ${ex.closeTime}`
                      : "Cerrado todo el día"}
                    {ex.note ? ` — ${ex.note}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending && deletingDate === ex.date}
                  onClick={() => handleDelete(ex.date)}
                >
                  {isPending && deletingDate === ex.date ? "Quitando..." : "Quitar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4"
        >
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isOpen"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Abre con horario especial</FormLabel>
              </FormItem>
            )}
          />
          {isOpen ? (
            <>
              <FormField
                control={form.control}
                name="openTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Abre</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Cierra</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-1">
                <FormLabel className="text-xs">Motivo (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Fiestas Patrias" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Agregar excepción"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
