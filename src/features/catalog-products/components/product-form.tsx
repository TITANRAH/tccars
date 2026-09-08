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
import { slugify } from "@/lib/slugify"
import {
  createProductAction,
  updateProductAction,
} from "@/features/catalog-products/actions/product.actions"
import {
  productSchema,
  type ProductInput,
} from "@/features/catalog-products/schemas/product.schema"

export function ProductForm({ product }: { product?: ProductInput & { id: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(!!product)

  const form = useForm<z.input<typeof productSchema>, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      name: "",
      slug: "",
      description: "",
      price: 0,
      imageUrl: "",
      stock: 0,
      published: true,
    },
  })

  function onSubmit(values: ProductInput) {
    setFormError(null)
    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, values)
        : await createProductAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success(product ? "Producto actualizado" : "Producto creado")
      }
    })
  }

  const imageUrl = useWatch({ control: form.control, name: "imageUrl" })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (!slugTouched) form.setValue("slug", slugify(e.target.value))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    setSlugTouched(true)
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <FormDescription>Se usa en la URL pública: /productos/{field.value}</FormDescription>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (CLP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
              <FormLabel className="!mt-0">Publicado (visible en el sitio)</FormLabel>
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/productos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
