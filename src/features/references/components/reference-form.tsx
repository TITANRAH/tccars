"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { compressImages } from "@/lib/compress-image"
import {
  createReferenceAction,
  updateReferenceAction,
} from "@/features/references/actions/reference.actions"
import {
  referenceSchema,
  type ReferenceInput,
} from "@/features/references/schemas/reference.schema"

export function ReferenceForm({
  reference,
}: {
  reference?: ReferenceInput & { id: string }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof referenceSchema>, unknown, ReferenceInput>({
    resolver: zodResolver(referenceSchema),
    defaultValues: reference ?? {
      authorName: "",
      comment: "",
      imageUrl: "",
      order: 0,
      published: true,
    },
  })

  function onSubmit(values: ReferenceInput) {
    setFormError(null)
    startTransition(async () => {
      const result = reference
        ? await updateReferenceAction(reference.id, values)
        : await createReferenceAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success(reference ? "Referencia actualizada" : "Referencia creada")
      }
    })
  }

  const imageUrl = useWatch({ control: form.control, name: "imageUrl" })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del cliente</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej: Marcela Soto" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentario</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} placeholder="Lo que dijo el cliente sobre el taller" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Foto (opcional)</FormLabel>
          {imageUrl ? (
            <div className="relative mb-2 size-24 overflow-hidden rounded-full border border-border">
              <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <UploadButton
            endpoint="catalogImage"
            onBeforeUploadBegin={compressImages}
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
              <FormLabel className="!mt-0">Publicada (visible en el sitio)</FormLabel>
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : reference ? "Guardar cambios" : "Crear referencia"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/referencias")}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
