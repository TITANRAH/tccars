"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  createSupplierAction,
  updateSupplierAction,
} from "@/features/suppliers/actions/supplier.actions"
import { supplierSchema, type SupplierInput } from "@/features/suppliers/schemas/supplier.schema"

export function SupplierForm({ supplier }: { supplier?: SupplierInput & { id: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof supplierSchema>, unknown, SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ?? {
      name: "",
      email: "",
      specialty: "",
      phone: "",
      active: true,
    },
  })

  function onSubmit(values: SupplierInput) {
    setFormError(null)
    startTransition(async () => {
      const result = supplier
        ? await updateSupplierAction(supplier.id, values)
        : await createSupplierAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del proveedor</FormLabel>
              <FormControl>
                <Input placeholder="Repuestos Andes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ventas@proveedor.cl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidad (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Frenos, motor..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="+56 9 1234 5678" {...field} />
                </FormControl>
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
              <FormLabel className="!mt-0">Activo (n8n puede cotizarle)</FormLabel>
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : supplier ? "Guardar cambios" : "Crear proveedor"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/proveedores")}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
