"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { createFaqAction, updateFaqAction } from "@/features/faq/actions/faq.actions"
import { faqSchema, type FaqInput } from "@/features/faq/schemas/faq.schema"

export function FaqForm({ faq }: { faq?: FaqInput & { id: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof faqSchema>, unknown, FaqInput>({
    resolver: zodResolver(faqSchema),
    defaultValues: faq ?? {
      question: "",
      answer: "",
      order: 0,
      published: true,
    },
  })

  function onSubmit(values: FaqInput) {
    setFormError(null)
    startTransition(async () => {
      const result = faq
        ? await updateFaqAction(faq.id, values)
        : await createFaqAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success(faq ? "Pregunta actualizada" : "Pregunta creada")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pregunta</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej: ¿Aceptan camionetas diésel?" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Respuesta</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} placeholder="Respuesta exacta que debe dar el bot" />
              </FormControl>
              <FormDescription>
                Esta respuesta la usa el bot de WhatsApp tal cual — sé preciso y evita ambigüedad.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value as string | number} />
              </FormControl>
              <FormDescription>Menor número aparece primero</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </FormControl>
              <FormLabel className="!mt-0">Publicada (visible para el bot)</FormLabel>
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : faq ? "Guardar cambios" : "Crear pregunta"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/faq")}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
