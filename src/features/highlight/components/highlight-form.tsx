"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useForm, useWatch } from "react-hook-form"
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
import { UploadButton } from "@/lib/uploadthing-client"
import { saveHighlightAction } from "@/features/highlight/actions/highlight.actions"
import { highlightSchema, type HighlightInput } from "@/features/highlight/schemas/highlight.schema"

export function HighlightForm({
  highlight,
}: {
  highlight?: HighlightInput & { id: string }
}) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof highlightSchema>, unknown, HighlightInput>({
    resolver: zodResolver(highlightSchema),
    defaultValues: highlight ?? {
      title: "",
      description: "",
      imageUrl: "",
      ctaLabel: "Ver más",
      ctaHref: "/contacto",
      active: true,
    },
  })

  function onSubmit(values: HighlightInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await saveHighlightAction(highlight?.id ?? null, values)
      if (!result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success("Destacado guardado")
      }
    })
  }

  const imageUrl = useWatch({ control: form.control, name: "imageUrl" })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej: Llegó el nuevo scanner OBD2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Imagen</FormLabel>
          {imageUrl ? (
            <div className="relative mb-2 h-40 w-full max-w-xs overflow-hidden rounded-lg border border-border">
              <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <UploadButton
            endpoint="catalogImage"
            onClientUploadComplete={(res) => {
              if (res?.[0]?.ufsUrl) {
                form.setValue("imageUrl", res[0].ufsUrl, { shouldValidate: true })
                toast.success("Imagen subida")
              }
            }}
            onUploadError={(error) => {
              toast.error(`Error al subir imagen: ${error.message}`)
            }}
          />
        </FormItem>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ctaLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto del botón</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ver más" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ctaHref"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enlace del botón</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="/productos/mi-producto" />
                </FormControl>
                <FormDescription>
                  Ej: /productos/&lt;slug&gt;, /servicios/&lt;slug&gt; o /contacto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="active"
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
              <FormLabel className="!mt-0">Activo (visible en la portada)</FormLabel>
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar destacado"}
        </Button>
      </form>
    </Form>
  )
}
