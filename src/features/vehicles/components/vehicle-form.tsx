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
import { ClientPicker } from "@/features/vehicles/components/client-picker"
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/features/vehicles/actions/vehicle.actions"
import { vehicleSchema, type VehicleInput } from "@/features/vehicles/schemas/vehicle.schema"

export function VehicleForm({
  vehicle,
}: {
  vehicle?: VehicleInput & { id: string; clientLabel?: string }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof vehicleSchema>, unknown, VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle ?? {
      patente: "",
      marca: "",
      modelo: "",
      anio: undefined,
      color: "",
      clientId: "",
    },
  })

  function onSubmit(values: VehicleInput) {
    setFormError(null)
    startTransition(async () => {
      const result = vehicle
        ? await updateVehicleAction(vehicle.id, values)
        : await createVehicleAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success(vehicle ? "Vehículo actualizado" : "Vehículo registrado")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dueño del vehículo</FormLabel>
              <FormControl>
                <ClientPicker
                  value={field.value}
                  onChange={field.onChange}
                  initialLabel={vehicle?.clientLabel}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="patente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patente</FormLabel>
              <FormControl>
                <Input placeholder="ABCD12" className="uppercase" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Yaris" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="anio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Gris" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : vehicle ? "Guardar cambios" : "Registrar vehículo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/colaborador/vehiculos")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
