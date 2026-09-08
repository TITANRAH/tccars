"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  createCollaboratorAction,
  updateCollaboratorAction,
} from "@/features/collaborators/actions/collaborator.actions"
import {
  collaboratorSchema,
  type CollaboratorInput,
} from "@/features/collaborators/schemas/collaborator.schema"

export function CollaboratorForm({
  collaborator,
}: {
  collaborator?: CollaboratorInput & { id: string }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const form = useForm<CollaboratorInput>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: collaborator ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      rut: "",
      position: "",
      birthDate: "",
      startDate: "",
      role: "COLLABORATOR",
    },
  })

  function onSubmit(values: CollaboratorInput) {
    setFormError(null)
    startTransition(async () => {
      if (collaborator) {
        const result = await updateCollaboratorAction(collaborator.id, values)
        if (result && !result.success) {
          setFormError(result.error)
          toast.error(result.error)
        }
        return
      }

      const result = await createCollaboratorAction(values)
      if (!result.success) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }
      setInviteLink(result.resetUrl)
      toast.success("Colaborador creado")
    })
  }

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast.success("Link copiado")
  }

  if (inviteLink) {
    return (
      <div className="space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-5">
        <p className="font-medium text-foreground">Colaborador creado.</p>
        <p className="text-sm text-muted-foreground">
          Copia este link y mándaselo por WhatsApp o el medio que prefieras para que cree su
          contraseña — vence en 48 horas. También se le envió por correo, pero mientras Resend siga
          fallando, este es el respaldo que sí funciona seguro.
        </p>
        <p className="rounded-lg border border-border bg-card p-3 font-mono text-xs break-all text-foreground">
          {inviteLink}
        </p>
        <div className="flex gap-3">
          <Button type="button" onClick={copyInviteLink}>
            Copiar link
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/colaboradores")}>
            Ir a colaboradores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="colaborador@tccars.cl"
                  disabled={!!collaborator}
                  {...field}
                />
              </FormControl>
              {collaborator ? (
                <p className="text-xs text-muted-foreground">
                  El correo no se puede cambiar desde aquí.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+56 9 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUT</FormLabel>
                <FormControl>
                  <Input placeholder="12.345.678-9" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Mecánico" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de entrada</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol en el sistema</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : collaborator ? "Guardar cambios" : "Crear colaborador"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/colaboradores")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
