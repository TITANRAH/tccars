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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  createMaintenanceAction,
  updateMaintenanceAction,
} from "@/features/maintenances/actions/maintenance.actions"
import {
  maintenanceSchema,
  type MaintenanceInput,
} from "@/features/maintenances/schemas/maintenance.schema"

type StaffOption = { id: string; name: string }

export function MaintenanceForm({
  vehicleId,
  staff,
  maintenance,
  appointmentId,
  prefill,
}: {
  vehicleId: string
  staff: StaffOption[]
  maintenance?: MaintenanceInput & { id: string }
  appointmentId?: string
  prefill?: { scheduledAt?: string; collaboratorId?: string }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.input<typeof maintenanceSchema>, unknown, MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: maintenance ?? {
      vehicleId,
      appointmentId: appointmentId ?? "",
      type: "MANTENCION",
      status: "AGENDADA",
      scheduledAt: prefill?.scheduledAt ?? "",
      collaboratorId: prefill?.collaboratorId ?? "",
      description: "",
      mileage: undefined,
      nextServiceMileage: undefined,
      laborCost: 0,
      partsCost: 0,
      additionalCost: 0,
      paymentStatus: "PENDIENTE",
    },
  })

  function onSubmit(values: MaintenanceInput) {
    setFormError(null)
    startTransition(async () => {
      const result = maintenance
        ? await updateMaintenanceAction(maintenance.id, values)
        : await createMaintenanceAction(values)

      if (result && !result.success) {
        setFormError(result.error)
        toast.error(result.error)
      } else if (maintenance) {
        toast.success("Mantención actualizada")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MANTENCION">Mantención</SelectItem>
                    <SelectItem value="VISITA_TECNICA">Visita técnica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AGENDADA">Agendada</SelectItem>
                    <SelectItem value="EN_PROCESO">En proceso</SelectItem>
                    <SelectItem value="COMPLETADA">Completada</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="collaboratorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colaborador asignado</FormLabel>
              <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha y hora agendada</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
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
              <FormLabel>Descripción del trabajo</FormLabel>
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
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kilometraje actual</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextServiceMileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próxima mantención (km)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="laborCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mano de obra (CLP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adicional (CLP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="partsCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repuestos (CLP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado de pago</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="PAGADO">Pagado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : maintenance ? "Guardar cambios" : "Crear mantención"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/colaborador/vehiculos/${vehicleId}`)}
          >
            Volver al vehículo
          </Button>
        </div>
      </form>
    </Form>
  )
}
